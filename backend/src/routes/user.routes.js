const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/users/stats - User statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users - List all users
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 500, search, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true,
          phone: true, isActive: true, lastLogin: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/users - Create user
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, phone, nip } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    let amtId = null;

    // If creating an AMT account, NIP is required and must link to an AMT record
    if (role === 'AMT') {
      if (!nip || !nip.trim()) {
        return res.status(400).json({ success: false, message: 'NIP wajib diisi untuk akun AMT' });
      }
      const amt = await prisma.amt.findUnique({ where: { nip: nip.trim() } });
      if (!amt) {
        return res.status(400).json({ success: false, message: 'NIP tidak ditemukan dalam data Awak MT. Pastikan AMT sudah didaftarkan terlebih dahulu.' });
      }
      if (!amt.isActive) {
        return res.status(400).json({ success: false, message: 'AMT dengan NIP ini sudah tidak aktif' });
      }
      // Check if this AMT already has a user account
      const existingAMTUser = await prisma.user.findFirst({ where: { amtId: amt.id } });
      if (existingAMTUser) {
        return res.status(400).json({ success: false, message: `AMT ini (${amt.name}) sudah memiliki akun pengguna` });
      }
      amtId = amt.id;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, phone, amtId },
      select: { id: true, name: true, email: true, role: true, phone: true, amtId: true, createdAt: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        details: `Created user: ${user.name} (${user.role})${amtId ? ` linked to AMT ID ${amtId}` : ''}`,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, isActive, password } = req.body;

    const data = { name, email, role, phone, isActive };
    if (password) {
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    
    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri' });
    }
    
    // Hard delete the user
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
