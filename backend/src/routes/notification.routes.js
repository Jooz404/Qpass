const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Semua notifikasi telah dibaca' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
