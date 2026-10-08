const router = require('express').Router();
const prisma = require('../lib/prisma');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

// POST /api/feedback - Submit feedback (PUBLIC - no auth required)
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const {
      loId, sealCondition, volumeStatus, volumeDiff,
      visualCondition, density, rating, notes, lat, lng,
    } = req.body;

    // Validate LO exists and no feedback yet
    const lo = await prisma.loadingOrder.findUnique({
      where: { id: parseInt(loId) },
      include: { feedback: true, spbu: true, truck: true, amt: true },
    });

    if (!lo) {
      return res.status(404).json({ success: false, message: 'Loading Order tidak ditemukan' });
    }

    if (lo.feedback) {
      return res.status(400).json({ success: false, message: 'Feedback untuk LO ini sudah dikirim' });
    }

    const densityVal = parseFloat(density);
    const ratingVal = parseInt(rating);
    const volumeDiffVal = volumeDiff ? parseFloat(volumeDiff) : null;

    // Determine status - HIGH_PRIORITY if any issue detected
    const isHighPriority =
      sealCondition === 'RUSAK' ||
      volumeStatus === 'SELISIH' ||
      visualCondition !== 'JERNIH' ||
      densityVal < 715 || densityVal > 770 ||
      ratingVal <= 2;

    const status = isHighPriority ? 'HIGH_PRIORITY' : 'NORMAL';

    // Build photo URL
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        loId: parseInt(loId),
        spbuId: lo.spbuId,
        sealCondition,
        volumeStatus,
        volumeDiff: volumeDiffVal,
        visualCondition,
        density: densityVal,
        rating: ratingVal,
        notes: notes || null,
        photoUrl,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        status,
      },
      include: {
        lo: {
          include: {
            spbu: { select: { name: true, code: true, address: true } },
            truck: { select: { nopol: true } },
            amt: { select: { name: true } },
          },
        },
      },
    });

    // Update LO status
    await prisma.loadingOrder.update({
      where: { id: parseInt(loId) },
      data: { status: 'COMPLETED' },
    });

    // If HIGH_PRIORITY, create complaint and notification
    if (isHighPriority) {
      const reasons = [];
      if (sealCondition === 'RUSAK') reasons.push('Segel Rusak');
      if (volumeStatus === 'SELISIH') reasons.push(`Volume Selisih (${volumeDiffVal}L)`);
      if (visualCondition !== 'JERNIH') reasons.push(`Visual: ${visualCondition.replace('_', ' ')}`);
      if (densityVal < 715 || densityVal > 770) reasons.push(`Densitas Di Luar Standar (${densityVal})`);
      if (ratingVal <= 2) reasons.push(`Rating Rendah (${ratingVal}/5)`);

      // Create complaint
      await prisma.complaint.create({
        data: {
          feedbackId: feedback.id,
          description: `HIGH PRIORITY: ${reasons.join(', ')} - LO: ${lo.noLO} - SPBU: ${lo.spbu.name}`,
          reasons: reasons.join(', '),
        },
      });

      // Create notification for all pengawas/admin
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'PENGAWAS'] }, isActive: true },
      });

      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: '⚠️ HIGH PRIORITY Feedback',
          message: `LO ${lo.noLO} | SPBU ${lo.spbu.name} | Masalah: ${reasons.join(', ')}`,
          type: 'critical',
          link: `/feedback/${feedback.id}`,
        })),
      });
    }

    // Emit real-time event via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const [spbuFeedbacks, amtFeedbacks] = await Promise.all([
        prisma.feedback.findMany({ where: { spbuId: lo.spbuId }, select: { rating: true } }),
        prisma.aMTFeedback.findMany({ where: { spbuId: lo.spbuId }, select: { ratingKeseluruhan: true } })
      ]);
      const allRatings = [
        ...spbuFeedbacks.map(f => f.rating),
        ...amtFeedbacks.map(af => af.ratingKeseluruhan)
      ];
      const avgRating = allRatings.length > 0 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length) : 0;

      io.to('dashboard').emit('spbu-rating-updated', {
        spbuId: lo.spbuId,
        averageRating: avgRating,
        hasComplaint: isHighPriority
      });

      io.to('dashboard').emit('new-feedback', {
        id: feedback.id,
        noLO: lo.noLO,
        spbu: lo.spbu.name,
        product: lo.product,
        status: feedback.status,
        rating: feedback.rating,
        submittedAt: feedback.submittedAt,
      });

      if (isHighPriority) {
        io.to('dashboard').emit('high-priority-alert', {
          feedbackId: feedback.id,
          noLO: lo.noLO,
          spbu: lo.spbu.name,
          product: lo.product,
          message: `⚠️ HIGH PRIORITY: ${lo.noLO} - ${lo.spbu.name}`,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Feedback berhasil dikirim! Terima kasih.',
      data: feedback,
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// GET /api/feedback - List feedbacks
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1, limit = 20, status, spbuId, product,
      startDate, endDate, rating, search,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (req.user.role === 'SPBU') {
      if (!req.user.spbuId) {
        return res.json({
          success: true,
          data: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: 0 },
        });
      }
      where.spbuId = req.user.spbuId;
    } else if (spbuId) {
      where.spbuId = parseInt(spbuId);
    }
    if (rating) where.rating = parseInt(rating);
    const loFilters = {};
    if (product) loFilters.product = product;
    if (search) {
      where.OR = [
        { lo: { noLO: { contains: search, mode: 'insensitive' } } },
        { lo: { product: { contains: search, mode: 'insensitive' } } },
        { lo: { spbu: { name: { contains: search, mode: 'insensitive' } } } },
        { lo: { truck: { nopol: { contains: search, mode: 'insensitive' } } } },
        { lo: { amt: { name: { contains: search, mode: 'insensitive' } } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (Object.keys(loFilters).length) {
      where.lo = { ...where.lo, ...loFilters };
    }
    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.submittedAt.lt = end;
      }
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          lo: {
            include: {
              spbu: { select: { id: true, name: true, code: true, address: true } },
              truck: { select: { id: true, nopol: true } },
              amt: { select: { id: true, name: true } },
            },
          },
          complaint: { select: { id: true, status: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.feedback.count({ where }),
    ]);

    res.json({
      success: true,
      data: feedbacks,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/feedback/:id
router.get('/:id', async (req, res) => {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        lo: {
          include: {
            spbu: true,
            truck: true,
            amt: true,
          },
        },
        complaint: { include: { resolvedBy: { select: { name: true } } } },
      },
    });

    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback tidak ditemukan' });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/feedback/live/feed - Get latest feedbacks for live monitoring
router.get('/live/feed', authenticate, async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      take: 50,
      orderBy: { submittedAt: 'desc' },
      include: {
        lo: {
          select: {
            noLO: true, product: true,
            spbu: { select: { name: true, code: true, address: true } },
            truck: { select: { nopol: true } },
            amt: { select: { name: true } },
          },
        },
      },
    });

    res.json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
