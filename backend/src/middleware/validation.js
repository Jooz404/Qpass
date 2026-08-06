const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nama minimal 2 karakter',
      'string.max': 'Nama maksimal 100 karakter',
      'any.required': 'Nama wajib diisi'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email tidak valid',
      'any.required': 'Email wajib diisi'
    }),
    password: Joi.string().min(6).max(50).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
      'string.min': 'Password minimal 6 karakter',
      'string.max': 'Password maksimal 50 karakter',
      'string.pattern.base': 'Password harus mengandung huruf besar, huruf kecil, dan angka',
      'any.required': 'Password wajib diisi'
    }),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
      'string.pattern.base': 'Nomor telepon tidak valid'
    }),
    role: Joi.string().valid('ADMIN', 'PENGAWAS', 'SPBU', 'AMT').optional()
  }),

  login: Joi.object({
    email: Joi.string().trim().email().optional(),
    username: Joi.string().trim().min(1).max(100).optional(),
    password: Joi.string().required().messages({
      'any.required': 'Password wajib diisi'
    })
  }).custom((value, helpers) => {
    const identifier = value.email || value.username;
    if (!identifier) {
      return helpers.error('any.required', { message: 'Email atau username wajib diisi' });
    }
    return value;
  }).options({ allowUnknown: true }),

  feedback: Joi.object({
    loId: Joi.number().integer().positive().required().messages({
      'any.required': 'LO ID wajib diisi',
      'number.base': 'LO ID harus berupa angka'
    }),
    sealCondition: Joi.string().valid('UTUH', 'RUSAK').required().messages({
      'any.required': 'Kondisi segel wajib diisi',
      'any.only': 'Kondisi segel tidak valid'
    }),
    volumeStatus: Joi.string().valid('SESUAI', 'SELISIH').required().messages({
      'any.required': 'Status volume wajib diisi',
      'any.only': 'Status volume tidak valid'
    }),
    volumeDiff: Joi.number().min(0).optional().messages({
      'number.min': 'Selisih volume tidak boleh negatif'
    }),
    visualCondition: Joi.string().valid('JERNIH', 'ADA_AIR', 'ADA_ENDAPAN').required().messages({
      'any.required': 'Kondisi visual wajib diisi',
      'any.only': 'Kondisi visual tidak valid'
    }),
    density: Joi.number().min(600).max(900).required().messages({
      'number.min': 'Densitas minimal 600',
      'number.max': 'Densitas maksimal 900',
      'any.required': 'Densitas wajib diisi'
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating minimal 1',
      'number.max': 'Rating maksimal 5',
      'any.required': 'Rating wajib diisi'
    }),
    notes: Joi.string().max(1000).optional().messages({
      'string.max': 'Catatan maksimal 1000 karakter'
    }),
    photoUrl: Joi.string().uri().optional().messages({
      'string.uri': 'URL foto tidak valid'
    }),
    lat: Joi.number().min(-90).max(90).optional().messages({
      'number.min': 'Latitude tidak valid',
      'number.max': 'Latitude tidak valid'
    }),
    lng: Joi.number().min(-180).max(180).optional().messages({
      'number.min': 'Longitude tidak valid',
      'number.max': 'Longitude tidak valid'
    })
  }),

  amtFeedback: Joi.object({
    loId: Joi.number().integer().positive().required().messages({
      'any.required': 'LO ID wajib diisi'
    }),
    ratingKeramahan: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating minimal 1',
      'number.max': 'Rating maksimal 5',
      'any.required': 'Rating keramahan wajib diisi'
    }),
    ratingKooperasi: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating minimal 1',
      'number.max': 'Rating maksimal 5',
      'any.required': 'Rating kerjasama wajib diisi'
    }),
    ratingFasilitas: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating minimal 1',
      'number.max': 'Rating maksimal 5',
      'any.required': 'Rating fasilitas wajib diisi'
    }),
    ratingProses: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating minimal 1',
      'number.max': 'Rating maksimal 5',
      'any.required': 'Rating proses wajib diisi'
    }),
    ratingKeseluruhan: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating minimal 1',
      'number.max': 'Rating maksimal 5',
      'any.required': 'Rating keseluruhan wajib diisi'
    }),
    notes: Joi.string().max(1000).optional().messages({
      'string.max': 'Catatan maksimal 1000 karakter'
    }),
    photoUrl: Joi.string().uri().optional().messages({
      'string.uri': 'URL foto tidak valid'
    }),
    lat: Joi.number().min(-90).max(90).optional().messages({
      'number.min': 'Latitude tidak valid',
      'number.max': 'Latitude tidak valid'
    }),
    lng: Joi.number().min(-180).max(180).optional().messages({
      'number.min': 'Longitude tidak valid',
      'number.max': 'Longitude tidak valid'
    })
  }),

  complaint: Joi.object({
    feedbackId: Joi.number().integer().positive().required().messages({
      'any.required': 'Feedback ID wajib diisi'
    }),
    description: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Deskripsi minimal 10 karakter',
      'string.max': 'Deskripsi maksimal 2000 karakter',
      'any.required': 'Deskripsi wajib diisi'
    }),
    reasons: Joi.string().required().messages({
      'any.required': 'Alasan keluhan wajib diisi'
    })
  }),

  spbu: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nama minimal 2 karakter',
      'string.max': 'Nama maksimal 100 karakter',
      'any.required': 'Nama wajib diisi'
    }),
    code: Joi.string().pattern(/^\d{2}\.\d{3}\.\d{2}$/).required().messages({
      'string.pattern.base': 'Kode SPBU harus format XX.XXX.XX',
      'any.required': 'Kode SPBU wajib diisi'
    }),
    address: Joi.string().min(5).max(200).required().messages({
      'string.min': 'Alamat minimal 5 karakter',
      'string.max': 'Alamat maksimal 200 karakter',
      'any.required': 'Alamat wajib diisi'
    }),
    city: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Kota minimal 2 karakter',
      'string.max': 'Kota maksimal 50 karakter',
      'any.required': 'Kota wajib diisi'
    }),
    region: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Region minimal 2 karakter',
      'string.max': 'Region maksimal 50 karakter',
      'any.required': 'Region wajib diisi'
    }),
    lat: Joi.number().min(-90).max(90).required().messages({
      'number.min': 'Latitude tidak valid',
      'number.max': 'Latitude tidak valid',
      'any.required': 'Latitude wajib diisi'
    }),
    lng: Joi.number().min(-180).max(180).required().messages({
      'number.min': 'Longitude tidak valid',
      'number.max': 'Longitude tidak valid',
      'any.required': 'Longitude wajib diisi'
    }),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
      'string.pattern.base': 'Nomor telepon tidak valid'
    }),
    ownerName: Joi.string().max(100).optional().messages({
      'string.max': 'Nama pemilik maksimal 100 karakter'
    })
  }),

  truck: Joi.object({
    nopol: Joi.string().pattern(/^[A-Z]{2}\s\d{4}\s[A-Z]{2}$/).required().messages({
      'string.pattern.base': 'Format nopol harus XX XXXX XX',
      'any.required': 'Nopol wajib diisi'
    }),
    capacity: Joi.number().min(1000).max(50000).required().messages({
      'number.min': 'Kapasitas minimal 1000 liter',
      'number.max': 'Kapasitas maksimal 50000 liter',
      'any.required': 'Kapasitas wajib diisi'
    }),
    type: Joi.string().valid('Tangki', 'Trailer').optional()
  }),

  amt: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nama minimal 2 karakter',
      'string.max': 'Nama maksimal 100 karakter',
      'any.required': 'Nama wajib diisi'
    }),
    nip: Joi.string().pattern(/^\d{16}$/).required().messages({
      'string.pattern.base': 'NIP harus 16 digit',
      'any.required': 'NIP wajib diisi'
    }),
    code: Joi.string().pattern(/^AMT-\d{6}-\d{5}$/).required().messages({
      'string.pattern.base': 'Kode AMT harus format AMT-XXXXXX-XXXXX',
      'any.required': 'Kode AMT wajib diisi'
    }),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
      'string.pattern.base': 'Nomor telepon tidak valid'
    })
  })
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ success: false, message: 'Validation schema not found' });
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors
      });
    }

    req.body = value;
    next();
  };
};

module.exports = { validate, schemas };
