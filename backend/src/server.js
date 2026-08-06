require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting - generous limits for smooth operational testing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs
  message: { success: false, message: 'Terlalu banyak request, silakan tunggu beberapa saat.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // allow up to 500 login attempts per 15 minutes for smooth testing
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi beberapa saat lagi.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/spbu', require('./routes/spbu.routes'));
app.use('/api/trucks', require('./routes/truck.routes'));
app.use('/api/amt', require('./routes/amt.routes'));
app.use('/api/lo', require('./routes/lo.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/amt-feedback', require('./routes/amt-feedback.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/export', require('./routes/export.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    name: 'Q-Pass Bitung API',
    version: '2.0.0',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join-dashboard', () => {
    socket.join('dashboard');
    console.log(`📊 ${socket.id} joined dashboard room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start server - fixed port 5002
const PORT = 5002;

server.listen(PORT, () => {
  console.log(`\n🚀 ======================================`);
  console.log(`   Q-PASS BITUNG API v2.0`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Socket.IO: enabled`);
  console.log(`======================================\n`);
});
