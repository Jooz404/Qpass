const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan'), false);
    }
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, username, password, spbuCode, role, address } = req.body;
    
    console.log('Registration attempt:', { name, username, spbuCode, role, address });

    if (!name || !username || !password || !spbuCode || !role) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    if (role === 'SPBU' && !address) {
      return res.status(400).json({ success: false, message: 'Alamat SPBU wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { email: username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    
    if (role === 'AMT') {
      // Validate AMT NIP
      const amt = await prisma.amt.findUnique({ where: { nip: spbuCode } });
      if (!amt) {
        return res.status(400).json({ success: false, message: 'NIP AMT tidak valid atau tidak terdaftar' });
      }

      if (!amt.isActive) {
        return res.status(400).json({ success: false, message: 'AMT tersebut tidak aktif' });
      }

      // Create new user with AMT role
      user = await prisma.user.create({
        data: {
          name,
          email: username,
          password: hashedPassword,
          role: 'AMT',
          amtId: amt.id,
          isActive: true,
        },
      });
    } else {
      // Validate SPBU code
      const spbu = await prisma.spbu.findUnique({ where: { code: spbuCode } });
      if (!spbu) {
        return res.status(400).json({ success: false, message: 'Kode SPBU tidak valid atau tidak terdaftar' });
      }

      if (!spbu.isActive) {
        return res.status(400).json({ success: false, message: 'SPBU tersebut tidak aktif' });
      }

      // Update SPBU address if provided
      if (address) {
        await prisma.spbu.update({
          where: { id: spbu.id },
          data: { address },
        });
      }

      // Create new user with SPBU role
      user = await prisma.user.create({
        data: {
          name,
          email: username,
          password: hashedPassword,
          role: 'SPBU',
          spbuId: spbu.id,
          isActive: true,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', validate('login'), async (req, res) => {
  try {
    const { email, username, password, lat, lng } = req.body;
    const loginEmail = email || username; // Support both email and username fields

    const user = await prisma.user.findUnique({ where: { email: loginEmail } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Akun telah dinonaktifkan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    // Update last login and location
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        ...(lat && lng && { lastLoginLat: lat, lastLoginLng: lng })
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          spbuId: user.spbuId,
          amtId: user.amtId,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, avatar: true, isActive: true, lastLogin: true,
        lastLoginLat: true, lastLoginLng: true,
        spbuId: true, amtId: true, createdAt: true,
        spbu: {
          select: {
            id: true, name: true, code: true, address: true,
            city: true, region: true,
          },
        },
      },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password saat ini salah' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/upload-photo
router.post('/upload-photo', authenticate, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar (maksimal 5MB)' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Error upload file' });
    }

    if (!req.file) {
      console.error('No file uploaded. Request body:', req.body);
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: photoUrl },
    }).then(() => {
      res.json({ 
        success: true, 
        message: 'Foto profil berhasil diperbarui',
        data: { photoUrl }
      });
    }).catch((error) => {
      console.error('Database error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    });
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
    });
    res.json({ success: true, message: 'Profil berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
