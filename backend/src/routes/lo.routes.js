const router = require('express').Router();
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const buildFeedbackQrUrl = (req, token) => {
  const configuredBase = process.env.FRONTEND_URL || process.env.QR_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const normalizedBase = configuredBase.replace(/\/+$/, '');
  const baseWithoutFeedbackPath = normalizedBase.endsWith('/feedback')
    ? normalizedBase.slice(0, -'/feedback'.length)
    : normalizedBase;

  return `${baseWithoutFeedbackPath}/feedback/${token}`;
};

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

// GET /api/lo - List loading orders
router.get('/', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, spbuId, date, product } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (req.user.role === 'SPBU' && req.user.spbuId) {
      where.spbuId = req.user.spbuId;
    } else if (spbuId) {
      where.spbuId = parseInt(spbuId);
    }
    if (search) {
      where.OR = [
        { noLO: { contains: search, mode: 'insensitive' } },
        { product: { contains: search, mode: 'insensitive' } },
        { spbu: { name: { contains: search, mode: 'insensitive' } } },
        { spbu: { code: { contains: search, mode: 'insensitive' } } },
        { truck: { nopol: { contains: search, mode: 'insensitive' } } },
        { amt: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;
    if (spbuId) where.spbuId = parseInt(spbuId);
    if (product) where.product = product;
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    }

    const [orders, total] = await Promise.all([
      prisma.loadingOrder.findMany({
        where,
        include: {
          spbu: { select: { id: true, name: true, code: true } },
          truck: { select: { id: true, nopol: true } },
          amt: { select: { id: true, name: true } },
          secondaryAmt: { select: { id: true, name: true } },
          feedback: { select: { id: true, status: true, rating: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.loadingOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Get LO error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/lo/by-token/:token - Public: Get LO by QR token (for feedback form)
router.get('/by-token/:token', async (req, res) => {
  try {
    const spbuId = req.query.spbuId ? parseInt(req.query.spbuId) : null;
    const amtId = req.query.amtId ? parseInt(req.query.amtId) : null;
    console.log('Fetching LO by token:', req.params.token, '| spbuId:', spbuId, '| amtId:', amtId);
    
    const lo = await prisma.loadingOrder.findUnique({
      where: { qrToken: req.params.token },
      include: {
        spbu: { select: { id: true, name: true, code: true, address: true } },
        truck: { select: { id: true, nopol: true } },
        amt: { select: { id: true, name: true } },
        secondaryAmt: { select: { id: true, name: true } },
        feedback: { select: { id: true } },
      },
    });

    if (!lo) {
      return res.status(404).json({ success: false, message: 'Loading Order tidak ditemukan' });
    }

    // Check SPBU filter if provided
    if (spbuId && lo.spbuId !== spbuId) {
      return res.status(403).json({ success: false, message: 'Loading Order ini bukan untuk SPBU Anda' });
    }

    // AMT can scan any LO (no AMT filter for AMT role)

    if (lo.feedback) {
      return res.status(400).json({ success: false, message: 'Feedback untuk LO ini sudah dikirim', feedbackExists: true });
    }

    console.log('LO found:', lo.noLO, 'SPBU:', lo.spbu.name);
    res.json({ success: true, data: lo });
  } catch (error) {
    console.error('Get LO by token error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/lo/by-no/:noLO - Public: Get LO by LO number (for feedback form)
router.get('/by-no/:noLO', async (req, res) => {
  try {
    let noLO = req.params.noLO.trim().toUpperCase();
    const spbuId = req.query.spbuId ? parseInt(req.query.spbuId) : null;
    const amtId = req.query.amtId ? parseInt(req.query.amtId) : null;

    console.log('Searching for LO with noLO:', noLO, '| spbuId:', spbuId, '| amtId:', amtId);
    
    // Try exact match first
    let lo = await prisma.loadingOrder.findUnique({
      where: { noLO },
      include: {
        spbu: { select: { id: true, name: true, code: true, address: true } },
        truck: { select: { id: true, nopol: true } },
        amt: { select: { id: true, name: true } },
        secondaryAmt: { select: { id: true, name: true } },
        feedback: { select: { id: true } },
      },
    });

    // If not found, try case-insensitive search
    if (!lo) {
      const allLos = await prisma.loadingOrder.findMany({
        where: { noLO: { mode: 'insensitive', equals: noLO } },
        include: {
          spbu: { select: { id: true, name: true, code: true, address: true } },
          truck: { select: { id: true, nopol: true } },
          amt: { select: { id: true, name: true } },
          secondaryAmt: { select: { id: true, name: true } },
          feedback: { select: { id: true } },
        },
      });
      lo = allLos[0];
    }

    if (!lo) {
      return res.status(404).json({ success: false, message: 'Loading Order tidak ditemukan. Pastikan format nomor LO benar (contoh: LO-20260720-8289)' });
    }

    // Check SPBU filter
    if (spbuId && lo.spbuId !== spbuId) {
      return res.status(404).json({ success: false, message: 'Loading Order tidak ditemukan untuk SPBU ini' });
    }

    // AMT can scan any LO (no AMT filter for AMT role)

    if (lo.feedback) {
      return res.status(400).json({ success: false, message: 'Feedback untuk LO ini sudah dikirim', feedbackExists: true });
    }

    console.log('LO found:', lo.noLO, 'SPBU:', lo.spbu.name);
    res.json({ success: true, data: lo });
  } catch (error) {
    console.error('Get LO by noLO error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/lo/:id
router.get('/:id', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const lo = await prisma.loadingOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        spbu: true,
        truck: true,
        amt: true,
        secondaryAmt: true,
        feedback: { include: { complaint: true } },
      },
    });
    if (!lo) return res.status(404).json({ success: false, message: 'LO tidak ditemukan' });
    res.json({ success: true, data: lo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/lo - Create loading order
router.post('/', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { noLO, product, volume, spbuId, truckId, amtId, secondaryAmtId, date } = req.body;
    const primaryAmtId = parseOptionalInt(amtId);
    const secondaryAmtIdValue = parseOptionalInt(secondaryAmtId);

    if (!primaryAmtId) return res.status(400).json({ success: false, message: 'AMT utama wajib dipilih' });
    if (secondaryAmtIdValue && primaryAmtId === secondaryAmtIdValue) {
      return res.status(400).json({ success: false, message: 'AMT utama dan AMT tambahan tidak boleh sama' });
    }

    // Validate unique noLO
    const existing = await prisma.loadingOrder.findUnique({ where: { noLO } });
    if (existing) return res.status(400).json({ success: false, message: 'Nomor LO sudah ada' });

    // Create LO with auto-generated qrToken
    const lo = await prisma.loadingOrder.create({
      data: {
        noLO,
        product,
        volume: parseFloat(volume),
        spbuId: parseInt(spbuId),
        truckId: parseInt(truckId),
        amtId: primaryAmtId,
        secondaryAmtId: secondaryAmtIdValue,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        spbu: { select: { name: true, code: true } },
        truck: { select: { nopol: true } },
        amt: { select: { name: true } },
        secondaryAmt: { select: { name: true } },
      },
    });

    // Generate QR Code
    const qrUrl = buildFeedbackQrUrl(req, lo.qrToken);
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    // Update LO with QR code
    const updatedLO = await prisma.loadingOrder.update({
      where: { id: lo.id },
      data: { qrCode: qrDataUrl },
      include: {
        spbu: { select: { id: true, name: true, code: true } },
        truck: { select: { id: true, nopol: true } },
        amt: { select: { id: true, name: true } },
        secondaryAmt: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'LoadingOrder',
        entityId: lo.id,
        details: `Created LO: ${noLO} | Product: ${product} | SPBU: ${lo.spbu.name}`,
      },
    });

    res.status(201).json({ success: true, data: updatedLO });
  } catch (error) {
    console.error('Create LO error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/lo/generate-daily - Generate daily LOs for all SPBU
router.post('/generate-daily', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '');

    const spbus = await prisma.spbu.findMany({ where: { isActive: true } });
    const trucks = await prisma.truck.findMany({ where: { isActive: true } });
    const amts = await prisma.amt.findMany({ where: { isActive: true } });

    const products = ['Pertalite', 'Pertamax', 'Pertamax Turbo', 'Dexlite', 'Pertamina Dex'];
    const volumes = { 'Pertalite': 8000, 'Pertamax': 8000, 'Pertamax Turbo': 8000, 'Dexlite': 8000, 'Pertamina Dex': 8000 };

    const created = [];
    let counter = 1;

    for (const spbu of spbus) {
      for (const product of products) {
        const noLO = `LO-${dateStr}-${String(counter).padStart(4, '0')}`;
        const truck = trucks[Math.floor(Math.random() * trucks.length)];
        const primaryAmt = amts[Math.floor(Math.random() * amts.length)];
        const secondaryAmtCandidates = amts.filter(amt => amt.id !== primaryAmt.id);
        const secondaryAmt = secondaryAmtCandidates.length > 0
          ? secondaryAmtCandidates[Math.floor(Math.random() * secondaryAmtCandidates.length)]
          : null;

        try {
          const lo = await prisma.loadingOrder.create({
            data: {
              noLO,
              product,
              volume: volumes[product],
              spbuId: spbu.id,
              truckId: truck.id,
              amtId: primaryAmt.id,
              secondaryAmtId: secondaryAmt?.id ?? null,
              date: targetDate,
            },
          });

          // Generate QR
          const qrUrl = buildFeedbackQrUrl(req, lo.qrToken);
          const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });

          await prisma.loadingOrder.update({
            where: { id: lo.id },
            data: { qrCode: qrDataUrl },
          });

          created.push(noLO);
          counter++;
        } catch (e) {
          // Skip duplicates
          counter++;
        }
      }
    }

    res.json({ success: true, message: `${created.length} Loading Orders berhasil dibuat`, data: created });
  } catch (error) {
    console.error('Generate daily LO error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/lo/:id/status - Update LO status (for AMT, Admin, Pengawas)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const loId = parseInt(req.params.id);

    if (!['PENDING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status LO tidak valid' });
    }

    const updatedLO = await prisma.loadingOrder.update({
      where: { id: loId },
      data: { status },
      include: {
        spbu: { select: { id: true, name: true, code: true } },
        truck: { select: { id: true, nopol: true } },
        amt: { select: { id: true, name: true } },
        secondaryAmt: { select: { id: true, name: true } },
      },
    });

    // Emit Socket.IO event for real-time status update
    const io = req.app.get('io');
    if (io) {
      io.emit('lo-status-updated', {
        loId: updatedLO.id,
        noLO: updatedLO.noLO,
        status: updatedLO.status,
        updatedAt: new Date(),
      });
    }

    res.json({ success: true, data: updatedLO });
  } catch (error) {
    console.error('Update LO status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/lo/:id
router.put('/:id', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { noLO, product, volume, spbuId, truckId, amtId, secondaryAmtId, date, status } = req.body;
    const primaryAmtId = amtId === undefined ? undefined : parseOptionalInt(amtId);
    const secondaryAmtIdValue = secondaryAmtId === undefined ? undefined : parseOptionalInt(secondaryAmtId);

    if (primaryAmtId !== undefined && !primaryAmtId) {
      return res.status(400).json({ success: false, message: 'AMT utama wajib dipilih' });
    }
    if (secondaryAmtIdValue !== undefined && secondaryAmtIdValue !== null && primaryAmtId !== undefined && primaryAmtId === secondaryAmtIdValue) {
      return res.status(400).json({ success: false, message: 'AMT utama dan AMT tambahan tidak boleh sama' });
    }

    const lo = await prisma.loadingOrder.update({
      where: { id: parseInt(req.params.id) },
      data: {
        noLO, product,
        volume: volume ? parseFloat(volume) : undefined,
        spbuId: spbuId ? parseInt(spbuId) : undefined,
        truckId: truckId ? parseInt(truckId) : undefined,
        amtId: primaryAmtId,
        secondaryAmtId: secondaryAmtIdValue,
        date: date ? new Date(date) : undefined,
        status,
      },
      include: {
        spbu: { select: { id: true, name: true, code: true } },
        truck: { select: { id: true, nopol: true } },
        amt: { select: { id: true, name: true } },
        secondaryAmt: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: lo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/lo/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    // Check if feedback exists
    const lo = await prisma.loadingOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { feedback: true },
    });
    if (lo?.feedback) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus LO yang sudah memiliki feedback' });
    }

    await prisma.loadingOrder.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Loading Order berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/lo/:id/qr - Regenerate QR code
router.get('/:id/qr', authenticate, async (req, res) => {
  try {
    const lo = await prisma.loadingOrder.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!lo) return res.status(404).json({ success: false, message: 'LO tidak ditemukan' });

    const qrUrl = buildFeedbackQrUrl(req, lo.qrToken);
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 400, margin: 2 });

    await prisma.loadingOrder.update({
      where: { id: lo.id },
      data: { qrCode: qrDataUrl },
    });

    res.json({ success: true, data: { qrCode: qrDataUrl, qrUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
