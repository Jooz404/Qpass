const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/spbu - List all SPBU
router.get('/', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, active } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (active !== undefined) where.isActive = active === 'true';

    const [spbus, total] = await Promise.all([
      prisma.spbu.findMany({
        where,
        include: {
          _count: {
            select: { loadingOrders: true, feedbacks: true },
          },
          feedbacks: {
            select: { rating: true }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.spbu.count({ where }),
    ]);

    const spbusWithRating = spbus.map(spbu => {
      const totalRating = spbu.feedbacks.reduce((sum, f) => sum + f.rating, 0);
      const avgRating = spbu.feedbacks.length > 0 ? (totalRating / spbu.feedbacks.length) : 0;
      
      // Remove feedbacks array and just return the average
      const { feedbacks, ...rest } = spbu;
      return {
        ...rest,
        averageRating: avgRating
      };
    });

    res.json({
      success: true,
      data: spbusWithRating,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Get SPBU error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/spbu/:id
router.get('/:id', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const spbu = await prisma.spbu.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        loadingOrders: { take: 10, orderBy: { createdAt: 'desc' }, include: { feedback: true } },
        feedbacks: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { loadingOrders: true, feedbacks: true } },
      },
    });
    if (!spbu) return res.status(404).json({ success: false, message: 'SPBU tidak ditemukan' });
    res.json({ success: true, data: spbu });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/spbu/map/markers - Get all SPBU for map
router.get('/map/markers', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const spbus = await prisma.spbu.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, code: true, address: true, lat: true, lng: true,
        feedbacks: {
          where: { status: 'HIGH_PRIORITY' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true, createdAt: true },
        },
        _count: {
          select: {
            feedbacks: { where: { status: 'HIGH_PRIORITY' } },
          },
        },
      },
    });

    const markers = spbus.map(s => ({
      ...s,
      hasComplaint: s._count.feedbacks > 0,
    }));

    res.json({ success: true, data: markers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/spbu
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, code, address, city, region, lat, lng, phone, ownerName } = req.body;
    const existing = await prisma.spbu.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Kode SPBU sudah ada' });
    }

    const spbu = await prisma.spbu.create({
      data: { name, code, address, city, region, lat: parseFloat(lat), lng: parseFloat(lng), phone, ownerName },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'CREATE', entity: 'SPBU', entityId: spbu.id, details: `Created SPBU: ${spbu.name}` },
    });

    res.status(201).json({ success: true, data: spbu });
  } catch (error) {
    console.error('Create SPBU error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/spbu/:id
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, code, address, city, region, lat, lng, phone, ownerName, isActive } = req.body;
    const spbu = await prisma.spbu.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name, code, address, city, region,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        phone, ownerName, isActive,
      },
    });
    res.json({ success: true, data: spbu });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/spbu/:id - Deactivate SPBU
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { permanent } = req.query;
    const spbuId = parseInt(req.params.id);

    if (permanent === 'true') {
      await prisma.user.updateMany({ where: { spbuId }, data: { spbuId: null } });
      await prisma.aMTFeedback.deleteMany({ where: { spbuId } });
      
      const loList = await prisma.loadingOrder.findMany({ where: { spbuId }, select: { id: true } });
      const loIds = loList.map(l => l.id);
      if (loIds.length > 0) {
        await prisma.feedback.deleteMany({ where: { loId: { in: loIds } } });
        await prisma.loadingOrder.deleteMany({ where: { spbuId } });
      }
      await prisma.spbu.delete({ where: { id: spbuId } });
      return res.json({ success: true, message: 'SPBU berhasil dihapus secara permanen' });
    }

    await prisma.spbu.update({
      where: { id: spbuId },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'SPBU berhasil dinonaktifkan' });
  } catch (error) {
    console.error('Delete SPBU error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/spbu/:id/permanent - Permanent Delete SPBU
router.delete('/:id/permanent', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const spbuId = parseInt(req.params.id);
    await prisma.user.updateMany({ where: { spbuId }, data: { spbuId: null } });
    await prisma.aMTFeedback.deleteMany({ where: { spbuId } });
    
    const loList = await prisma.loadingOrder.findMany({ where: { spbuId }, select: { id: true } });
    const loIds = loList.map(l => l.id);
    if (loIds.length > 0) {
      await prisma.feedback.deleteMany({ where: { loId: { in: loIds } } });
      await prisma.loadingOrder.deleteMany({ where: { spbuId } });
    }
    await prisma.spbu.delete({ where: { id: spbuId } });
    res.json({ success: true, message: 'SPBU berhasil dihapus secara permanen' });
  } catch (error) {
    console.error('Permanent Delete SPBU error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus SPBU' });
  }
});

module.exports = router;
