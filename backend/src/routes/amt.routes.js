const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/amt/my-lo - Get LOs for the authenticated AMT
router.get('/my-lo', authenticate, authorize('AMT'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      OR: [
        { amtId: req.user.amtId },
        { secondaryAmtId: req.user.amtId }
      ]
    };

    if (status) {
      where.status = status;
    }

    const [los, total] = await Promise.all([
      prisma.loadingOrder.findMany({
        where,
        include: {
          spbu: { select: { id: true, name: true, code: true, address: true } },
          originalSpbu: { select: { id: true, name: true, code: true } },
          truck: { select: { id: true, nopol: true, capacity: true } },
          amt: { select: { id: true, name: true } },
          secondaryAmt: { select: { id: true, name: true } },
          feedback: { select: { id: true, rating: true, submittedAt: true } },
          amtFeedbacks: { 
            where: { amtId: req.user.amtId },
            select: { id: true, ratingKeseluruhan: true, submittedAt: true }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.loadingOrder.count({ where })
    ]);

    res.json({
      success: true,
      data: los,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get AMT LOs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/amt
router.get('/', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const { search, active } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (active !== undefined) where.isActive = active === 'true';

    const amts = await prisma.amt.findMany({
      where,
      include: { _count: { select: { loadingOrders: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: amts });
  } catch (error) {
    console.error('AMT search error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// GET /api/amt/:id/report - AMT report card
router.get('/:id/report', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const amtId = parseInt(req.params.id);
    const amt = await prisma.amt.findUnique({
      where: { id: amtId },
      include: {
        loadingOrders: {
          include: {
            feedback: true,
            spbu: { select: { name: true, code: true } },
            truck: { select: { nopol: true } },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!amt) return res.status(404).json({ success: false, message: 'AMT tidak ditemukan' });

    const feedbacks = amt.loadingOrders.filter(lo => lo.feedback).map(lo => lo.feedback);
    const totalDeliveries = amt.loadingOrders.length;
    const totalFeedbacks = feedbacks.length;
    const totalComplaints = feedbacks.filter(f => f.status === 'HIGH_PRIORITY').length;
    const avgRating = totalFeedbacks > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / totalFeedbacks : 0;

    // Calculate score (0-100)
    let score = 100;
    if (totalFeedbacks > 0) {
      const complaintRate = totalComplaints / totalFeedbacks;
      const ratingScore = (avgRating / 5) * 50;
      const complaintScore = (1 - complaintRate) * 50;
      score = Math.round(ratingScore + complaintScore);
    }

    res.json({
      success: true,
      data: {
        amt,
        stats: { totalDeliveries, totalFeedbacks, totalComplaints, avgRating: Math.round(avgRating * 10) / 10, score },
        recentOrders: amt.loadingOrders.slice(0, 20),
      },
    });
  } catch (error) {
    console.error('AMT search error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Helper: generate unique NIP in format AMT-YYYYMM-XXXXX
async function generateNIP() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `AMT-${year}${month}-`;

  // Find highest existing sequence for this month
  const existing = await prisma.amt.findMany({
    where: { nip: { startsWith: prefix } },
    select: { nip: true },
    orderBy: { nip: 'desc' },
  });

  let nextSeq = 1;
  if (existing.length > 0) {
    const lastNip = existing[0].nip; // e.g. AMT-202507-00023
    const lastSeq = parseInt(lastNip.replace(prefix, ''), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(5, '0')}`;
}

// GET /api/amt/generate-nip - Preview next NIP (ADMIN & PENGAWAS)
router.get('/generate-nip', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const nip = await generateNIP();
    res.json({ success: true, data: { nip } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// GET /api/amt/by-nip/:nip - Lookup AMT by NIP (for linking user account)
router.get('/by-nip/:nip', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const amt = await prisma.amt.findUnique({
      where: { nip: req.params.nip },
      select: { id: true, name: true, nip: true, phone: true, isActive: true },
    });
    if (!amt) {
      return res.status(404).json({ success: false, message: 'NIP AMT tidak ditemukan' });
    }
    if (!amt.isActive) {
      return res.status(400).json({ success: false, message: 'AMT dengan NIP ini sudah tidak aktif' });
    }
    res.json({ success: true, data: amt });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// POST /api/amt
router.post('/', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { name, phone, nip } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama AMT wajib diisi' });
    }
    if (!nip || !nip.trim()) {
      return res.status(400).json({ success: false, message: 'NIP AMT wajib diisi' });
    }

    const trimmedNip = nip.trim();

    // Check if NIP is already registered
    const existing = await prisma.amt.findUnique({
      where: { nip: trimmedNip }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'NIP AMT sudah terdaftar' });
    }

    const amt = await prisma.amt.create({
      data: {
        name: name.trim(),
        nip: trimmedNip,
        code: trimmedNip,
        phone
      }
    });
    res.status(201).json({ success: true, data: amt });
  } catch (error) {
    console.error('AMT create error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// PUT /api/amt/:id
router.put('/:id', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { name, nip, phone, isActive } = req.body;
    const trimmedNip = nip ? nip.trim() : undefined;

    if (trimmedNip) {
      const existing = await prisma.amt.findFirst({
        where: {
          nip: trimmedNip,
          NOT: {
            id: parseInt(req.params.id)
          }
        }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'NIP AMT sudah digunakan oleh AMT lain' });
      }
    }

    const amt = await prisma.amt.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        nip: trimmedNip,
        code: trimmedNip,
        phone,
        isActive
      },
    });
    res.json({ success: true, data: amt });
  } catch (error) {
    console.error('AMT search error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// DELETE /api/amt/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    await prisma.amt.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
    res.json({ success: true, message: 'AMT berhasil dinonaktifkan' });
  } catch (error) {
    console.error('AMT search error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

module.exports = router;
