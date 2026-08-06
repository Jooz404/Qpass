const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isSpbu = req.user.role === 'SPBU';
    const spbuId = req.user.spbuId;

    if (isSpbu && !spbuId) {
      return res.json({
        success: true,
        data: {
          totalLOToday: 0, totalFeedback: 0, feedbackToday: 0,
          highPriorityCount: 0, openComplaints: 0, avgRating: 0,
          totalSpbu: 1, totalTrucks: 0, totalAmt: 0,
        },
      });
    }

    const [
      totalLOToday, totalFeedback, feedbackToday,
      highPriorityCount, totalSpbu, totalTrucks,
      totalAmt, avgRating, openComplaints,
    ] = await Promise.all([
      prisma.loadingOrder.count({ where: isSpbu ? ({ spbuId, date: { gte: today, lt: tomorrow } }) : ({ date: { gte: today, lt: tomorrow } }) }),
      prisma.feedback.count({ where: isSpbu ? ({ spbuId }) : ({}) }),
      prisma.feedback.count({ where: isSpbu ? ({ spbuId, submittedAt: { gte: today, lt: tomorrow } }) : ({ submittedAt: { gte: today, lt: tomorrow } }) }),
      prisma.feedback.count({ where: isSpbu ? ({ spbuId, status: 'HIGH_PRIORITY' }) : ({ status: 'HIGH_PRIORITY' }) }),
      isSpbu ? Promise.resolve(1) : prisma.spbu.count({ where: { isActive: true } }),
      isSpbu 
        ? prisma.loadingOrder.groupBy({ by: ['truckId'], where: { spbuId } }).then(res => res.length)
        : prisma.truck.count({ where: { isActive: true } }),
      isSpbu
        ? prisma.loadingOrder.groupBy({ by: ['amtId'], where: { spbuId } }).then(res => res.length)
        : prisma.amt.count({ where: { isActive: true } }),
      prisma.feedback.aggregate({ where: isSpbu ? ({ spbuId }) : ({}), _avg: { rating: true } }),
      prisma.complaint.count({ where: isSpbu ? ({ feedback: { spbuId }, status: { in: ['OPEN', 'IN_PROGRESS'] } }) : ({ status: { in: ['OPEN', 'IN_PROGRESS'] } }) }),
    ]);

    res.json({
      success: true,
      data: {
        totalLOToday,
        totalFeedback,
        feedbackToday,
        highPriorityCount,
        openComplaints,
        avgRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
        totalSpbu,
        totalTrucks,
        totalAmt,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/charts/monthly
router.get('/charts/monthly', authenticate, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const months = [];

    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 1);

      const [loCount, feedbackCount, highPriorityCount, avgRating] = await Promise.all([
        prisma.loadingOrder.count({ where: { date: { gte: start, lt: end } } }),
        prisma.feedback.count({ where: { submittedAt: { gte: start, lt: end } } }),
        prisma.feedback.count({ where: { submittedAt: { gte: start, lt: end }, status: 'HIGH_PRIORITY' } }),
        prisma.feedback.aggregate({
          where: { submittedAt: { gte: start, lt: end } },
          _avg: { rating: true },
        }),
      ]);

      months.push({
        month: m + 1,
        monthName: start.toLocaleString('id-ID', { month: 'long' }),
        loCount,
        feedbackCount,
        highPriorityCount,
        avgRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
      });
    }

    res.json({ success: true, data: months });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/charts/products
router.get('/charts/products', authenticate, async (req, res) => {
  try {
    const products = await prisma.loadingOrder.groupBy({
      by: ['product'],
      _count: { id: true },
      _sum: { volume: true },
    });

    const productFeedbacks = await prisma.feedback.findMany({
      include: { lo: { select: { product: true } } },
    });

    const productStats = products.map(p => {
      const fbs = productFeedbacks.filter(f => f.lo.product === p.product);
      const highPriority = fbs.filter(f => f.status === 'HIGH_PRIORITY').length;
      const avgRating = fbs.length > 0 ? fbs.reduce((s, f) => s + f.rating, 0) / fbs.length : 0;

      return {
        product: p.product,
        totalLO: p._count.id,
        totalVolume: p._sum.volume,
        totalFeedbacks: fbs.length,
        highPriority,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    });

    res.json({ success: true, data: productStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/charts/spbu-performance
router.get('/charts/spbu-performance', authenticate, async (req, res) => {
  try {
    const spbus = await prisma.spbu.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { feedbacks: true, loadingOrders: true } },
        feedbacks: {
          select: { rating: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = spbus.map(s => {
      const avgRating = s.feedbacks.length > 0
        ? s.feedbacks.reduce((sum, f) => sum + f.rating, 0) / s.feedbacks.length : 0;
      const complaints = s.feedbacks.filter(f => f.status === 'HIGH_PRIORITY').length;

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        totalLO: s._count.loadingOrders,
        totalFeedbacks: s._count.feedbacks,
        complaints,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/charts/density
router.get('/charts/density', authenticate, async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      take: 100,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true, density: true, submittedAt: true,
        lo: { select: { noLO: true, product: true, spbu: { select: { name: true } } } },
      },
    });

    res.json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', authenticate, async (req, res) => {
  try {
    const isSpbu = req.user.role === 'SPBU';
    const spbuId = req.user.spbuId;

    if (isSpbu && !spbuId) {
      return res.json({ success: true, data: { recentFeedbacks: [], recentComplaints: [] } });
    }

    const [recentFeedbacks, recentComplaints] = await Promise.all([
      prisma.feedback.findMany({
        where: isSpbu ? { spbuId } : {},
        take: 10,
        orderBy: { submittedAt: 'desc' },
        include: {
          lo: {
            select: {
              noLO: true, product: true,
              spbu: { select: { name: true } },
              amt: { select: { name: true } },
              truck: { select: { nopol: true } },
            },
          },
        },
      }),
      prisma.complaint.findMany({
        take: 5,
        where: isSpbu 
          ? { feedback: { spbuId }, status: { in: ['OPEN', 'IN_PROGRESS'] } }
          : { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        include: {
          feedback: {
            include: { lo: { select: { noLO: true, spbu: { select: { name: true } } } } },
          },
        },
      }),
    ]);

    res.json({ success: true, data: { recentFeedbacks, recentComplaints } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
