const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// Helper to generate unique LO Discharge Code
async function generateLODischargeCode() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `LO-DISCH-${dateStr}-`;

  const countToday = await prisma.vesselDischarge.count({
    where: {
      noLODischarge: { startsWith: prefix },
    },
  });

  const nextSeq = String(countToday + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

// GET /api/vessel-discharge/stats - Aggregate stats for CQD Vessel Discharge
router.get('/stats', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const totalRecords = await prisma.vesselDischarge.count();
    const warningCount = await prisma.vesselDischarge.count({ where: { isToleranceExceeded: true } });

    const totalReceivedAgg = await prisma.vesselDischarge.aggregate({
      _sum: {
        totalReceivedLiters15: true,
        blQuantityLiters15: true,
      },
    });

    const totalL15Received = totalReceivedAgg._sum.totalReceivedLiters15 || 0;
    const totalL15BL = totalReceivedAgg._sum.blQuantityLiters15 || 0;
    const overallShortage = totalL15Received - totalL15BL;

    res.json({
      success: true,
      data: {
        totalRecords,
        warningCount,
        totalL15Received,
        totalL15BL,
        overallShortage,
      },
    });
  } catch (error) {
    console.error('VesselDischarge Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// GET /api/vessel-discharge - List all CQD records
router.get('/', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const { search, product, isWarning, limit = 100 } = req.query;
    const where = {};

    if (product) where.product = product;
    if (isWarning === 'true') where.isToleranceExceeded = true;

    if (search) {
      where.OR = [
        { noLODischarge: { contains: search, mode: 'insensitive' } },
        { vesselName: { contains: search, mode: 'insensitive' } },
        { product: { contains: search, mode: 'insensitive' } },
        { externalNo: { contains: search, mode: 'insensitive' } },
        { bastNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.vesselDischarge.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        tanks: true,
      },
      orderBy: { cqdDate: 'desc' },
      take: parseInt(limit),
    });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('VesselDischarge GET error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// GET /api/vessel-discharge/:id - Get detail CQD record
router.get('/:id', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const record = await prisma.vesselDischarge.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        tanks: { orderBy: { id: 'asc' } },
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Dokumen CQD Vessel Discharge tidak ditemukan' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('VesselDischarge GET detail error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// POST /api/vessel-discharge - Create CQD Record
router.post('/', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const {
      noLODischarge,
      vesselName,
      loadedAt,
      dischargeAt = '1419 Integrated Terminal Bitung',
      externalNo,
      bastNumber,
      materialNo,
      poNumber,
      product,
      psoType = 'PSO',
      cqdDate,
      cqdTime,
      blQuantityLitersObs,
      blQuantityLiters15,
      blQuantityMetricTon,
      blQuantityBarrels60F,
      remarks,
      loadingPort,
      surveyorBy,
      preparedBy,
      checkedBy,
      acknowledgeBy,
      tanks = [],
    } = req.body;

    if (!vesselName || !product || !loadedAt) {
      return res.status(400).json({
        success: false,
        message: 'Nama Kapal, Jenis Produk, dan Pelabuhan Asal wajib diisi',
      });
    }

    const loCode = noLODischarge || (await generateLODischargeCode());

    // Calculate sum from tanks if provided
    let totalReceivedLitersObs = 0;
    let totalReceivedLiters15 = 0;
    let totalReceivedMetricTon = 0;

    const tankDataToCreate = tanks.map((tank) => {
      const netObs = parseFloat(tank.netProductObsL || 0);
      const l15 = parseFloat(tank.liters15 || 0);
      const mt = parseFloat(tank.metricTon || 0);

      totalReceivedLitersObs += netObs;
      totalReceivedLiters15 += l15;
      totalReceivedMetricTon += mt;

      return {
        tankNo: String(tank.tankNo || 'Tank'),
        indication: tank.indication || 'NET',
        date: tank.date ? new Date(tank.date) : new Date(),
        time: tank.time || null,
        testDensity: tank.testDensity ? parseFloat(tank.testDensity) : null,
        testTemp: tank.testTemp ? parseFloat(tank.testTemp) : null,
        density15C: tank.density15C ? parseFloat(tank.density15C) : null,
        totalDip: tank.totalDip ? parseFloat(tank.totalDip) : null,
        waterDip: tank.waterDip ? parseFloat(tank.waterDip) : 0,
        tempObs: tank.tempObs ? parseFloat(tank.tempObs) : null,
        netProductObsL: netObs,
        correction: tank.correction ? parseFloat(tank.correction) : null,
        liters15: l15,
        longTonsPer1000L: tank.longTonsPer1000L ? parseFloat(tank.longTonsPer1000L) : null,
        longTons: tank.longTons ? parseFloat(tank.longTons) : null,
        barrels60F: tank.barrels60F ? parseFloat(tank.barrels60F) : null,
        metricTon: mt,
      };
    });

    const parsedBL15 = parseFloat(blQuantityLiters15 || 0);
    const parsedBLObs = parseFloat(blQuantityLitersObs || 0);
    const parsedBLMT = parseFloat(blQuantityMetricTon || 0);

    // Calculate Shortage / Excess
    const shortageL15 = parsedBL15 > 0 ? totalReceivedLiters15 - parsedBL15 : 0;
    const shortageObs = parsedBLObs > 0 ? totalReceivedLitersObs - parsedBLObs : 0;
    const shortageMT = parsedBLMT > 0 ? totalReceivedMetricTon - parsedBLMT : 0;

    // Calculate % VS B/L
    let percentageVsBL = 0;
    if (parsedBL15 > 0) {
      percentageVsBL = (shortageL15 / parsedBL15) * 100;
    }

    // Flag if tolerance exceeded (Shortage > 0.5% negative, i.e., percentageVsBL < -0.5)
    const isToleranceExceeded = percentageVsBL < -0.5;

    const record = await prisma.vesselDischarge.create({
      data: {
        noLODischarge: loCode,
        vesselName,
        loadedAt,
        dischargeAt,
        externalNo: externalNo || null,
        bastNumber: bastNumber || null,
        materialNo: materialNo || null,
        poNumber: poNumber || null,
        product,
        psoType,
        cqdDate: cqdDate ? new Date(cqdDate) : new Date(),
        cqdTime: cqdTime || null,
        blQuantityLitersObs: parsedBLObs,
        blQuantityLiters15: parsedBL15,
        blQuantityMetricTon: parsedBLMT,
        blQuantityBarrels60F: blQuantityBarrels60F ? parseFloat(blQuantityBarrels60F) : null,
        totalReceivedLitersObs,
        totalReceivedLiters15,
        totalReceivedMetricTon,
        shortageLitersObs: shortageObs,
        shortageLiters15: shortageL15,
        shortageMetricTon: shortageMT,
        percentageVsBL: parseFloat(percentageVsBL.toFixed(3)),
        isToleranceExceeded,
        remarks: remarks || null,
        loadingPort: loadingPort || null,
        surveyorBy: surveyorBy || null,
        preparedBy: preparedBy || null,
        checkedBy: checkedBy || null,
        acknowledgeBy: acknowledgeBy || null,
        createdById: req.user?.id || null,
        tanks: {
          create: tankDataToCreate,
        },
      },
      include: {
        tanks: true,
      },
    });

    // Create entry in QualityControl pipeline to maintain cross-system traceability
    const avgDens15C = tankDataToCreate.length > 0
      ? tankDataToCreate.reduce((acc, t) => acc + (t.density15C || 0), 0) / tankDataToCreate.length
      : 850;

    await prisma.qualityControl.create({
      data: {
        stage: 'VESSEL_DISCHARGE',
        product,
        batchNo: loCode,
        sourceName: vesselName,
        density15C: avgDens15C,
        visualCondition: 'JERNIH',
        inspectorName: preparedBy || req.user?.name || 'Inspector QQ',
        notes: `CQD Discharge Kapal ${vesselName} (B/L: ${parsedBL15} L, Received: ${totalReceivedLiters15} L, Susut: ${percentageVsBL.toFixed(3)}%)`,
        status: isToleranceExceeded ? 'OFF_SPEC' : 'PASSED',
        isOffSpec: isToleranceExceeded,
        createdById: req.user?.id || null,
      },
    }).catch((err) => console.error('Auto QC entry error:', err));

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: 'CREATE_CQD_VESSEL_DISCHARGE',
        entity: 'VesselDischarge',
        entityId: record.id,
        details: `Input CQD ${loCode} Kapal ${vesselName} (${product}) - Received: ${totalReceivedLiters15} L15 (% VS B/L: ${percentageVsBL.toFixed(3)}%)`,
      },
    }).catch(() => {});

    // Notification if Tolerance Exceeded
    if (isToleranceExceeded) {
      await prisma.notification.create({
        data: {
          title: `⚠️ WARN SUSUT KARGO KAPAL (OVER TOLERANCE)`,
          message: `Discharge Kapal ${vesselName} (${loCode}) mengalami susut ${percentageVsBL.toFixed(3)}% (Selisih: ${shortageL15.toLocaleString()} L15) melebihi batas 0.5%!`,
          type: 'critical',
          link: '/quality-control',
        },
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: isToleranceExceeded
        ? 'Dokumen CQD berhasil disimpan (PERINGATAN: Susut melebihi batas toleransi 0.5%)'
        : 'Dokumen CQD Discharge Kapal berhasil disimpan',
      data: record,
    });
  } catch (error) {
    console.error('VesselDischarge POST error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// DELETE /api/vessel-discharge/:id - Delete CQD record
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.vesselDischarge.delete({ where: { id } });
    res.json({ success: true, message: 'Dokumen CQD Vessel Discharge berhasil dihapus' });
  } catch (error) {
    console.error('VesselDischarge DELETE error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

module.exports = router;
