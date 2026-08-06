const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/complaints
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { reasons: { contains: search, mode: 'insensitive' } },
        { feedback: { lo: { noLO: { contains: search, mode: 'insensitive' } } } },
        { feedback: { lo: { spbu: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }
    if (req.user.role === 'SPBU') {
      if (!req.user.spbuId) {
        return res.json({
          success: true,
          data: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: 0 },
        });
      }
      where.feedback = { spbuId: req.user.spbuId };
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          feedback: {
            include: {
              lo: {
                include: {
                  spbu: { select: { name: true, code: true } },
                  truck: { select: { nopol: true } },
                  amt: { select: { name: true } },
                },
              },
            },
          },
          resolvedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.complaint.count({ where }),
    ]);

    res.json({
      success: true,
      data: complaints,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/complaints/:id/resolve
router.put('/:id/resolve', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { resolvedNote } = req.body;
    const complaint = await prisma.complaint.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'RESOLVED',
        resolvedById: req.user.id,
        resolvedNote,
        resolvedAt: new Date(),
      },
      include: {
        feedback: { include: { lo: { include: { spbu: { select: { name: true } } } } } },
      },
    });

    // Emit resolved event
    const io = req.app.get('io');
    if (io) {
      io.to('dashboard').emit('complaint-resolved', {
        complaintId: complaint.id,
        resolvedBy: req.user.name,
      });
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/complaints/:id/status
router.put('/:id/status', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await prisma.complaint.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
