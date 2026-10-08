const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// Helper to validate Density 15°C specification according to Pertamina standards
function validateDensitySpec(product, density15C) {
  if (!density15C) return { isOffSpec: false, min: 0, max: 999 };

  const p = (product || '').toUpperCase();
  let min = 715;
  let max = 770;

  if (p.includes('SOLAR') || p.includes('BIOSOLAR') || p.includes('DEX')) {
    min = 815;
    max = 870;
  } else if (p.includes('AVTUR')) {
    min = 775;
    max = 840;
  } else if (p.includes('MFO') || p.includes('RESIDU')) {
    min = 890;
    max = 990;
  }

  const isOffSpec = density15C < min || density15C > max;
  return { isOffSpec, min, max };
}

// GET /api/quality-control/stats - Get quality control statistics
router.get('/stats', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const total = await prisma.qualityControl.count();
    const passed = await prisma.qualityControl.count({ where: { status: 'PASSED' } });
    const offSpec = await prisma.qualityControl.count({ where: { isOffSpec: true } });
    const vesselCount = await prisma.qualityControl.count({ where: { stage: 'VESSEL_DISCHARGE' } });
    const tankCount = await prisma.qualityControl.count({ where: { stage: 'STORAGE_TANK' } });
    const truckCount = await prisma.qualityControl.count({ where: { stage: 'FILLING_SHED_TRUCK' } });

    res.json({
      success: true,
      data: {
        total,
        passed,
        offSpec,
        vesselCount,
        tankCount,
        truckCount,
      },
    });
  } catch (error) {
    console.error('QC Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// GET /api/quality-control - List all quality control records
router.get('/', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const { stage, product, status, search, limit = 100 } = req.query;
    const where = {};

    if (stage) where.stage = stage;
    if (product) where.product = product;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { sourceName: { contains: search, mode: 'insensitive' } },
        { batchNo: { contains: search, mode: 'insensitive' } },
        { inspectorName: { contains: search, mode: 'insensitive' } },
        { product: { contains: search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.qualityControl.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lo: { select: { id: true, noLO: true, product: true, volume: true } },
      },
      orderBy: { sampleDate: 'desc' },
      take: parseInt(limit),
    });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('QC Get error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// GET /api/quality-control/:id - Get detail
router.get('/:id', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const record = await prisma.qualityControl.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lo: {
          select: {
            id: true,
            noLO: true,
            product: true,
            volume: true,
            spbu: { select: { name: true, code: true } },
            truck: { select: { nopol: true } },
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Log Quality Control tidak ditemukan' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('QC Get detail error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// POST /api/quality-control - Create quality log entry
router.post('/', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const {
      stage = 'VESSEL_DISCHARGE',
      product,
      batchNo,
      sourceName,
      densityObserved,
      temperature,
      density15C,
      visualCondition = 'JERNIH',
      waterContent,
      flashPoint,
      sampleDate,
      inspectorName,
      notes,
      certificateUrl,
      loId,
    } = req.body;

    if (!product || !sourceName || density15C === undefined || density15C === null) {
      return res.status(400).json({
        success: false,
        message: 'Produk, Sumber (Kapal/Tanki/Mobil Tanki), dan Density 15°C wajib diisi',
      });
    }

    const parsedDensity15C = parseFloat(density15C);
    const specCheck = validateDensitySpec(product, parsedDensity15C);
    const isOffSpec = specCheck.isOffSpec;
    const computedStatus = isOffSpec ? 'OFF_SPEC' : 'PASSED';

    const record = await prisma.qualityControl.create({
      data: {
        stage,
        product,
        batchNo: batchNo || null,
        sourceName,
        densityObserved: densityObserved ? parseFloat(densityObserved) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        density15C: parsedDensity15C,
        visualCondition,
        waterContent: waterContent ? parseFloat(waterContent) : null,
        flashPoint: flashPoint ? parseFloat(flashPoint) : null,
        sampleDate: sampleDate ? new Date(sampleDate) : new Date(),
        inspectorName: inspectorName || req.user?.name || 'Admin QQ',
        notes: notes || null,
        certificateUrl: certificateUrl || null,
        status: computedStatus,
        isOffSpec,
        loId: loId ? parseInt(loId) : null,
        createdById: req.user?.id || null,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: 'CREATE_QUALITY_CONTROL',
        entity: 'QualityControl',
        entityId: record.id,
        details: `Input QC ${stage} untuk ${product} (${sourceName}) - Status: ${computedStatus}`,
      },
    }).catch(() => {});

    // Create Notification if Off-Spec
    if (isOffSpec) {
      await prisma.notification.create({
        data: {
          title: `⚠️ PERINGATAN OFF-SPEC QUALITY CONTROL`,
          message: `Kualitas ${product} dari ${sourceName} (${stage}) terdeteksi Out-Of-Spec! Density 15°C: ${parsedDensity15C} kg/m³ (Standar: ${specCheck.min}-${specCheck.max} kg/m³)`,
          type: 'critical',
          link: '/quality-control',
        },
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: isOffSpec
        ? 'Log Kualitas berhasil dibuat (PERINGATAN: Kualitas Out-of-Spec)'
        : 'Log Kualitas BBM berhasil disimpan',
      data: record,
    });
  } catch (error) {
    console.error('QC Create error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// PUT /api/quality-control/:id - Update quality log entry
router.put('/:id', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.qualityControl.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Log Quality Control tidak ditemukan' });
    }

    const {
      stage,
      product,
      batchNo,
      sourceName,
      densityObserved,
      temperature,
      density15C,
      visualCondition,
      waterContent,
      flashPoint,
      sampleDate,
      inspectorName,
      notes,
      certificateUrl,
      status,
      loId,
    } = req.body;

    const parsedProduct = product || existing.product;
    const parsedDensity15C = density15C !== undefined ? parseFloat(density15C) : existing.density15C;
    const specCheck = validateDensitySpec(parsedProduct, parsedDensity15C);
    const isOffSpec = specCheck.isOffSpec;
    const computedStatus = status || (isOffSpec ? 'OFF_SPEC' : 'PASSED');

    const updated = await prisma.qualityControl.update({
      where: { id },
      data: {
        stage: stage || existing.stage,
        product: parsedProduct,
        batchNo: batchNo !== undefined ? batchNo : existing.batchNo,
        sourceName: sourceName || existing.sourceName,
        densityObserved: densityObserved !== undefined ? parseFloat(densityObserved) : existing.densityObserved,
        temperature: temperature !== undefined ? parseFloat(temperature) : existing.temperature,
        density15C: parsedDensity15C,
        visualCondition: visualCondition || existing.visualCondition,
        waterContent: waterContent !== undefined ? parseFloat(waterContent) : existing.waterContent,
        flashPoint: flashPoint !== undefined ? parseFloat(flashPoint) : existing.flashPoint,
        sampleDate: sampleDate ? new Date(sampleDate) : existing.sampleDate,
        inspectorName: inspectorName || existing.inspectorName,
        notes: notes !== undefined ? notes : existing.notes,
        certificateUrl: certificateUrl !== undefined ? certificateUrl : existing.certificateUrl,
        status: computedStatus,
        isOffSpec,
        loId: loId ? parseInt(loId) : existing.loId,
      },
    });

    res.json({ success: true, message: 'Data Quality Control berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('QC Update error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// DELETE /api/quality-control/:id - Delete quality log
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.qualityControl.delete({ where: { id } });
    res.json({ success: true, message: 'Log Quality Control berhasil dihapus' });
  } catch (error) {
    console.error('QC Delete error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus log QC: ' + error.message });
  }
});

module.exports = router;
