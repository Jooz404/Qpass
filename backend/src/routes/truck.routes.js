const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/trucks
router.get('/', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const { search, active } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { nopol: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (active !== undefined) where.isActive = active === 'true';

    const trucks = await prisma.truck.findMany({
      where,
      include: {
        _count: { select: { loadingOrders: true } },
      },
      orderBy: { nopol: 'asc' },
    });

    res.json({ success: true, data: trucks });
  } catch (error) {
    console.error('Truck search error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// GET /api/trucks/:id/report - Truck report card
router.get('/:id/report', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      include: {
        loadingOrders: {
          include: {
            feedback: true,
            spbu: { select: { name: true, code: true } },
            amt: { select: { name: true } },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!truck) return res.status(404).json({ success: false, message: 'Truck tidak ditemukan' });

    const feedbacks = truck.loadingOrders.filter(lo => lo.feedback).map(lo => lo.feedback);
    const totalDeliveries = truck.loadingOrders.length;
    const totalFeedbacks = feedbacks.length;
    const totalComplaints = feedbacks.filter(f => f.status === 'HIGH_PRIORITY').length;
    const avgRating = totalFeedbacks > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / totalFeedbacks : 0;

    res.json({
      success: true,
      data: {
        truck,
        stats: { totalDeliveries, totalFeedbacks, totalComplaints, avgRating: Math.round(avgRating * 10) / 10 },
        recentOrders: truck.loadingOrders.slice(0, 20),
      },
    });
  } catch (error) {
    console.error('Truck search error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// POST /api/trucks
router.post('/', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { nopol, capacity, type } = req.body;
    const existing = await prisma.truck.findUnique({ where: { nopol } });
    if (existing) return res.status(400).json({ success: false, message: 'Nopol sudah terdaftar' });

    const truck = await prisma.truck.create({
      data: { nopol: nopol.toUpperCase(), capacity: parseFloat(capacity) || 8000, type },
    });
    res.status(201).json({ success: true, data: truck });
  } catch (error) {
    console.error('Truck search error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// PUT /api/trucks/:id
router.put('/:id', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { nopol, capacity, type, isActive } = req.body;
    const truck = await prisma.truck.update({
      where: { id: parseInt(req.params.id) },
      data: { nopol: nopol?.toUpperCase(), capacity: capacity ? parseFloat(capacity) : undefined, type, isActive },
    });
    res.json({ success: true, data: truck });
  } catch (error) {
    console.error('Truck search error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// DELETE /api/trucks/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    try {
      await prisma.truck.delete({ where: { id } });
      return res.json({ success: true, message: 'Mobil Tangki berhasil dihapus' });
    } catch (err) {
      if (err.code === 'P2003') {
        await prisma.truck.update({ where: { id }, data: { isActive: false } });
        return res.json({ success: true, message: 'Mobil Tangki dinonaktifkan karena memiliki riwayat pengiriman' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Truck delete error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus Mobil Tangki: ' + error.message });
  }
});

module.exports = router;
