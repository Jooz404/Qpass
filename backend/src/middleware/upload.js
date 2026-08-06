const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(sanitizedName).toLowerCase();
    cb(null, `feedback-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  // Allowed file extensions
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check both MIME type and extension
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WebP.'), false);
  }
  
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Ekstensi file tidak didukung. Gunakan .jpg, .jpeg, .png, atau .webp'), false);
  }
  
  // Check file size (additional validation)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return cb(new Error('Ukuran file terlalu besar. Maksimal 5MB.'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 1, // Only allow single file upload
  },
});

module.exports = upload;
