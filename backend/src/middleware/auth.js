const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true, spbuId: true, amtId: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User tidak valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  const allowedRoles = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
