const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/amt-feedback - Submit AMT feedback for SPBU
router.post('/', authenticate, authorize('AMT'), async (req, res) => {
  try {
    const {
      loId,
      spbuId,
      ratingKeramahan,
      ratingKooperasi,
      ratingFasilitas,
      ratingProses,
      ratingKeseluruhan,
      notes,
      photoUrl,
      lat,
      lng
    } = req.body;

    // Validate required fields
    if (!loId || !spbuId) {
      return res.status(400).json({ success: false, message: 'LO ID dan SPBU ID wajib diisi' });
    }

    // Validate ratings (1-5)
    const ratings = [ratingKeramahan, ratingKooperasi, ratingFasilitas, ratingProses, ratingKeseluruhan];
    for (const rating of ratings) {
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating harus antara 1-5' });
      }
    }

    // Check if LO exists and belongs to this AMT
    const lo = await prisma.loadingOrder.findUnique({
      where: { id: parseInt(loId) },
      include: {
        amt: true,
        spbu: true
      }
    });

    if (!lo) {
      return res.status(404).json({ success: false, message: 'Loading Order tidak ditemukan' });
    }

    // Verify AMT is assigned to this LO
    if (lo.amtId !== req.user.amtId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke Loading Order ini' });
    }

    // Verify SPBU matches the LO's SPBU
    if (lo.spbuId !== parseInt(spbuId)) {
      return res.status(400).json({ success: false, message: 'SPBU ID tidak sesuai dengan Loading Order' });
    }

    // Check if AMT already submitted feedback for this LO
    const existingFeedback = await prisma.aMTFeedback.findUnique({
      where: {
        loId_amtId: {
          loId: parseInt(loId),
          amtId: req.user.amtId
        }
      }
    });

    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'Feedback untuk Loading Order ini sudah dikirim' });
    }

    // Create AMT feedback
    const feedback = await prisma.aMTFeedback.create({
      data: {
        amtId: req.user.amtId,
        spbuId: parseInt(spbuId),
        loId: parseInt(loId),
        ratingKeramahan,
        ratingKooperasi,
        ratingFasilitas,
        ratingProses,
        ratingKeseluruhan,
        notes,
        photoUrl,
        lat,
        lng
      },
      include: {
        amt: { select: { id: true, name: true } },
        spbu: { select: { id: true, name: true, code: true } },
        lo: { select: { id: true, noLO: true, product: true } }
      }
    });

    // Update LO status to COMPLETED if both SPBU and AMT feedback exist
    const spbuFeedback = await prisma.feedback.findUnique({
      where: { loId: parseInt(loId) }
    });

    if (spbuFeedback) {
      await prisma.loadingOrder.update({
        where: { id: parseInt(loId) },
        data: { status: 'COMPLETED' }
      });
    }

    // Emit real-time socket event for SPBU rating update
    const io = req.app.get('io');
    if (io) {
      const [spbuFeedbacks, amtFeedbacks] = await Promise.all([
        prisma.feedback.findMany({ where: { spbuId: parseInt(spbuId) }, select: { rating: true } }),
        prisma.aMTFeedback.findMany({ where: { spbuId: parseInt(spbuId) }, select: { ratingKeseluruhan: true } })
      ]);
      const allRatings = [
        ...spbuFeedbacks.map(f => f.rating),
        ...amtFeedbacks.map(af => af.ratingKeseluruhan)
      ];
      const avgRating = allRatings.length > 0 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length) : 0;

      io.to('dashboard').emit('spbu-rating-updated', {
        spbuId: parseInt(spbuId),
        averageRating: avgRating
      });
    }

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error('Create AMT feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/amt-feedback/lo/:loId - Get AMT feedback for a specific LO
router.get('/lo/:loId', authenticate, authorize('AMT', 'ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { loId } = req.params;

    const feedbacks = await prisma.aMTFeedback.findMany({
      where: { loId: parseInt(loId) },
      include: {
        amt: { select: { id: true, name: true } },
        spbu: { select: { id: true, name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Get AMT feedback by LO error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/amt-feedback/spbu/:spbuId - Get AMT feedback for a specific SPBU
router.get('/spbu/:spbuId', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { spbuId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [feedbacks, total] = await Promise.all([
      prisma.aMTFeedback.findMany({
        where: { spbuId: parseInt(spbuId) },
        include: {
          amt: { select: { id: true, name: true } },
          lo: { select: { id: true, noLO: true, product: true, date: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.aMTFeedback.count({ where: { spbuId: parseInt(spbuId) } })
    ]);

    // Calculate average ratings
    const avgRatings = await prisma.aMTFeedback.aggregate({
      where: { spbuId: parseInt(spbuId) },
      _avg: {
        ratingKeramahan: true,
        ratingKooperasi: true,
        ratingFasilitas: true,
        ratingProses: true,
        ratingKeseluruhan: true
      }
    });

    res.json({
      success: true,
      data: feedbacks,
      stats: {
        total,
        avgRatings: avgRatings._avg,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get AMT feedback by SPBU error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/amt-feedback/my - Get AMT's own feedback history
router.get('/my', authenticate, authorize('AMT'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [feedbacks, total] = await Promise.all([
      prisma.aMTFeedback.findMany({
        where: { amtId: req.user.amtId },
        include: {
          spbu: { select: { id: true, name: true, code: true } },
          lo: { select: { id: true, noLO: true, product: true, date: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.aMTFeedback.count({ where: { amtId: req.user.amtId } })
    ]);

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my AMT feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/amt-feedback/stats - Get AMT feedback statistics
router.get('/stats', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const [totalFeedbacks, avgRatings, topSPBU, recentFeedbacks] = await Promise.all([
      prisma.aMTFeedback.count(),
      prisma.aMTFeedback.aggregate({
        _avg: {
          ratingKeramahan: true,
          ratingKooperasi: true,
          ratingFasilitas: true,
          ratingProses: true,
          ratingKeseluruhan: true
        }
      }),
      prisma.aMTFeedback.groupBy({
        by: ['spbuId'],
        _avg: {
          ratingKeseluruhan: true
        },
        orderBy: {
          _avg: {
            ratingKeseluruhan: 'desc'
          }
        },
        take: 5
      }),
      prisma.aMTFeedback.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          amt: { select: { id: true, name: true } },
          spbu: { select: { id: true, name: true, code: true } }
        }
      })
    ]);

    // Get SPBU details for top SPBU
    const spbuIds = topSPBU.map(item => item.spbuId);
    const spbuDetails = await prisma.spbu.findMany({
      where: { id: { in: spbuIds } },
      select: { id: true, name: true, code: true }
    });

    const topSPBUWithDetails = topSPBU.map(item => ({
      ...item,
      spbu: spbuDetails.find(s => s.id === item.spbuId)
    }));

    res.json({
      success: true,
      data: {
        totalFeedbacks,
        avgRatings: avgRatings._avg,
        topSPBU: topSPBUWithDetails,
        recentFeedbacks
      }
    });
  } catch (error) {
    console.error('Get AMT feedback stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
