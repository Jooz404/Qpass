# DOKUMENTASI SISTEM Q-PASS BITUNG
## Quality & Quantity Assurance Testimonial System

---

## DAFTAR ISI

1. [Overview Sistem](#1-overview-sistem)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Teknologi yang Digunakan](#3-teknologi-yang-digunakan)
4. [Struktur Folder Project](#4-struktur-folder-project)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Fitur dan Fungsionalitas](#7-fitur-dan-fungsionalitas)
8. [Flow Sistem](#8-flow-sistem)
9. [Keamanan Sistem](#9-keamanan-sistem)
10. [Konfigurasi Environment](#10-konfigurasi-environment)

---

## 1. OVERVIEW SISTEM

### 1.1 Deskripsi Sistem

Q-Pass Bitung adalah sistem Quality & Quantity Assurance Testimonial berbasis web yang dikembangkan untuk monitoring pengiriman Bahan Bakar Minyak (BBM) dari Terminal Bitung ke berbagai Stasiun Pengisian Bahan Bakar Umum (SPBU). Sistem ini menyediakan mekanisme tracking loading order, sistem feedback terstruktur, deteksi keluhan otomatis, dan notifikasi real-time.

### 1.2 Tujuan Sistem

- Monitoring loading order secara real-time
- Tracking pengiriman BBM menggunakan QR code
- Sistem feedback multi-aspek dari SPBU dan AMT
- Deteksi otomatis keluhan berdasarkan parameter feedback
- Notifikasi real-time untuk semua stakeholder
- Dashboard komprehensif untuk analisis data

### 1.3 Pengguna Sistem

Sistem memiliki 4 role pengguna dengan akses berbeda:

1. **ADMIN** - Akses penuh ke seluruh sistem
2. **PENGAWAS** - Monitoring dan analisis data
3. **SPBU** - Feedback dan riwayat penerimaan
4. **AMT (Awak Mobil Tangki)** - Rating SPBU dan feedback

---

## 2. ARSITEKTUR SISTEM

### 2.1 Arsitektur High-Level

```
┌─────────────────┐
│   Frontend      │
│   (React.js)    │
└────────┬────────┘
         │ HTTP/REST API
         │ WebSocket (Socket.IO)
┌────────▼────────┐
│   Backend       │
│   (Node.js)     │
│   (Express.js)  │
└────────┬────────┘
         │ Prisma ORM
┌────────▼────────┐
│   Database      │
│   (PostgreSQL)  │
└─────────────────┘
```

### 2.2 Arsitektur Backend

Backend menggunakan arsitektur RESTful API dengan komponen:

- **Routes** - Menangani HTTP requests dan responses
- **Controllers** - Business logic
- **Middleware** - Authentication, authorization, validation
- **Services** - Business logic kompleks
- **Models** - Database models (via Prisma)
- **Socket.IO** - Real-time communication

### 2.3 Arsitektur Frontend

Frontend menggunakan arsitektur Single Page Application (SPA):

- **Components** - UI components reusable
- **Pages** - Halaman utama aplikasi
- **Context** - State management global
- **Hooks** - Custom React hooks
- **Services** - API calls
- **Utils** - Helper functions

---

## 3. TEKNOLOGI YANG DIGUNAKAN

### 3.1 Frontend Technologies

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React.js | 18.x | UI Framework |
| React Router | 6.x | Routing |
| Tailwind CSS | 3.x | Styling |
| Lucide React | Latest | Icons |
| Axios | Latest | HTTP Client |
| Socket.IO Client | 4.x | Real-time communication |

### 3.2 Backend Technologies

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Node.js | 18.x | Runtime Environment |
| Express.js | 4.x | Web Framework |
| Prisma | 5.x | ORM |
| PostgreSQL | 15.x | Database |
| JWT | 9.x | Authentication |
| Bcryptjs | 2.x | Password Hashing |
| Socket.IO | 4.x | Real-time communication |
| Multer | 1.x | File Upload |
| QRCode | 1.x | QR Code Generation |
| ExcelJS | 4.x | Excel Export |
| PDFKit | 0.x | PDF Generation |
| Nodemailer | 6.x | Email Sending |
| Helmet | 8.x | Security Headers |
| Express-rate-limit | 8.x | Rate Limiting |
| Joi | Latest | Input Validation |

### 3.3 Development Tools

| Teknologi | Fungsi |
|-----------|--------|
| Nodemon | Auto-restart development server |
| ESLint | Code linting |
| Prettier | Code formatting |
| Git | Version control |

---

## 4. STRUKTUR FOLDER PROJECT

### 4.1 Struktur Backend

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Database seeding
├── scripts/
│   └── backup-db.js           # Backup database script
├── src/
│   ├── lib/
│   │   └── prisma.js          # Prisma client initialization
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   ├── upload.js          # File upload middleware
│   │   └── validation.js      # Input validation middleware
│   ├── routes/
│   │   ├── auth.routes.js     # Authentication endpoints
│   │   ├── user.routes.js     # User management
│   │   ├── spbu.routes.js     # SPBU management
│   │   ├── truck.routes.js    # Truck management
│   │   ├── amt.routes.js      # AMT management
│   │   ├── lo.routes.js       # Loading order management
│   │   ├── feedback.routes.js  # Feedback management
│   │   ├── amt-feedback.routes.js  # AMT feedback management
│   │   ├── complaints.routes.js    # Complaint management
│   │   ├── dashboard.routes.js     # Dashboard endpoints
│   │   ├── export.routes.js        # Data export
│   │   └── notification.routes.js  # Notification management
│   └── server.js              # Main server file
├── uploads/                   # Uploaded files
├── .env                       # Environment variables
├── .env.example               # Environment template
└── package.json               # Dependencies
```

### 4.2 Struktur Frontend

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── components/            # Reusable components
│   │   ├── DashboardLayout.jsx
│   │   ├── Logo.jsx
│   │   └── ...
│   ├── context/               # Context providers
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── lib/                   # Utility functions
│   │   └── api.js             # API client
│   ├── pages/                 # Page components
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── Dashboard.jsx
│   │   └── ...
│   ├── services/              # API services
│   │   └── ...
│   ├── App.jsx                # Main App component
│   ├── index.css              # Global styles
│   └── main.jsx               # Entry point
├── .env                       # Environment variables
├── index.html                 # HTML template
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind configuration
└── vite.config.js             # Vite configuration
```

---

## 5. DATABASE SCHEMA

### 5.1 Tabel Utama

#### **users**
Menyimpan data pengguna sistem.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key, auto-increment |
| name | String | Nama lengkap user |
| email | String | Email user (unique) |
| password | String | Password terenkripsi (bcrypt) |
| role | Enum | Role user (ADMIN, PENGAWAS, SPBU, AMT) |
| phone | String? | Nomor telepon |
| avatar | String? | URL avatar |
| isActive | Boolean | Status aktif user |
| isVerified | Boolean | Status verifikasi |
| otpCode | String? | Kode OTP |
| otpExpiry | DateTime? | Expired OTP |
| lastLogin | DateTime? | Waktu login terakhir |
| spbuId | Int? | Foreign key ke SPBU (untuk user SPBU) |
| amtId | Int? | Foreign key ke AMT (untuk user AMT) |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diupdate |

#### **spbus**
Menyimpan data SPBU.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| name | String | Nama SPBU |
| code | String | Kode SPBU (unique) |
| address | String | Alamat SPBU |
| city | String | Kota |
| region | String | Region |
| lat | Float | Latitude |
| lng | Float | Longitude |
| phone | String? | Nomor telepon |
| ownerName | String? | Nama pemilik |
| isActive | Boolean | Status aktif |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diupdate |

#### **trucks**
Menyimpan data mobil tangki.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| nopol | String | Nomor polisi (unique) |
| capacity | Float | Kapasitas (liter) |
| type | String | Jenis tangki |
| isActive | Boolean | Status aktif |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diupdate |

#### **amts**
Menyimpan data Awak Mobil Tangki.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| name | String | Nama AMT |
| nip | String | NIP (unique) |
| code | String | Kode AMT (unique) |
| phone | String? | Nomor telepon |
| isActive | Boolean | Status aktif |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diupdate |

#### **loading_orders**
Menyimpan data loading order.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| noLO | String | Nomor LO (unique) |
| product | String | Jenis produk BBM |
| volume | Float | Volume (liter) |
| date | DateTime | Tanggal LO |
| status | Enum | Status (PENDING, IN_TRANSIT, DELIVERED, COMPLETED) |
| qrCode | String? | QR code (base64) |
| qrToken | String | Token QR (unique) |
| spbuId | Int | Foreign key ke SPBU |
| truckId | Int | Foreign key ke Truck |
| amtId | Int | Foreign key ke AMT (primary) |
| secondaryAmtId | Int? | Foreign key ke AMT (secondary) |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diupdate |

#### **feedbacks**
Menyimpan feedback dari SPBU.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| loId | Int | Foreign key ke LO (unique) |
| spbuId | Int | Foreign key ke SPBU |
| sealCondition | Enum | Kondisi segel (UTUH, RUSAK) |
| volumeStatus | Enum | Status volume (SESUAI, SELISIH) |
| volumeDiff | Float? | Selisih volume |
| visualCondition | Enum | Kondisi visual (JERNIH, ADA_AIR, ADA_ENDAPAN) |
| density | Float | Densitas (kg/m³) |
| rating | Int | Rating (1-5) |
| notes | String? | Catatan |
| photoUrl | String? | URL foto |
| lat | Float? | Latitude |
| lng | Float? | Longitude |
| status | Enum | Status (NORMAL, HIGH_PRIORITY) |
| submittedAt | DateTime | Waktu submit |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diupdate |

#### **amt_feedbacks**
Menyimpan feedback dari AMT.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| amtId | Int | Foreign key ke AMT |
| spbuId | Int | Foreign key ke SPBU |
| loId | Int | Foreign key ke LO |
| ratingKeramahan | Int | Rating keramahan (1-5) |
| ratingKooperasi | Int | Rating kerjasama (1-5) |
| ratingFasilitas | Int | Rating fasilitas (1-5) |
| ratingProses | Int | Rating proses (1-5) |
| ratingKeseluruhan | Int | Rating keseluruhan (1-5) |
| notes | String? | Catatan |
| photoUrl | String? | URL foto |
| lat | Float? | Latitude |
| lng | Float? | Longitude |
| submittedAt | DateTime | Waktu submit |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diupdate |

#### **complaints**
Menyimpan data keluhan.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| feedbackId | Int | Foreign key ke Feedback (unique) |
| description | String | Deskripsi keluhan |
| reasons | String | Alasan keluhan |
| status | Enum | Status (OPEN, IN_PROGRESS, RESOLVED, CLOSED) |
| resolvedById | Int? | Foreign key ke User |
| resolvedNote | String? | Catatan resolusi |
| resolvedAt | DateTime? | Waktu resolusi |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu diupdate |

#### **notifications**
Menyimpan notifikasi.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| userId | Int? | Foreign key ke User |
| title | String | Judul notifikasi |
| message | String | Pesan notifikasi |
| type | String | Tipe (info, warning, critical) |
| isRead | Boolean | Status baca |
| link | String? | Link |
| createdAt | DateTime | Waktu dibuat |

#### **audit_logs**
Menyimpan log aktivitas.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | Int | Primary key |
| userId | Int? | Foreign key ke User |
| action | String | Aksi yang dilakukan |
| entity | String | Entitas yang diakses |
| entityId | Int? | ID entitas |
| details | String? | Detail aktivitas |
| ipAddress | String? | IP address |
| createdAt | DateTime | Waktu dibuat |

### 5.2 Relasi Antar Tabel

```
users (1) ─── (N) spbus
users (1) ─── (N) amts
users (1) ─── (N) complaints
users (1) ─── (N) audit_logs
users (1) ─── (N) notifications

spbus (1) ─── (N) loading_orders
spbus (1) ─── (N) feedbacks
spbus (1) ─── (N) amt_feedbacks
spbus (1) ─── (N) users

trucks (1) ─── (N) loading_orders

amts (1) ─── (N) loading_orders (primary)
amts (1) ─── (N) loading_orders (secondary)
amts (1) ─── (N) amt_feedbacks

loading_orders (1) ─── (1) feedbacks
loading_orders (1) ─── (N) amt_feedbacks

feedbacks (1) ─── (1) complaints
```

---

## 6. API ENDPOINTS

### 6.1 Authentication Endpoints

#### POST /api/auth/register
Registrasi user baru (SPBU atau AMT).

**Request Body:**
```json
{
  "name": "Nama User",
  "username": "email@example.com",
  "password": "password123",
  "spbuCode": "74.951.01",
  "role": "SPBU"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Nama User",
      "email": "email@example.com",
      "role": "SPBU"
    }
  }
}
```

#### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "admin@qpass.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "name": "Administrator",
      "email": "admin@qpass.com",
      "role": "ADMIN",
      "phone": "081234567890",
      "spbuId": null,
      "amtId": null
    }
  }
}
```

#### GET /api/auth/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Administrator",
    "email": "admin@qpass.com",
    "role": "ADMIN",
    "phone": "081234567890",
    "avatar": null,
    "isActive": true,
    "lastLogin": "2026-07-22T01:00:00.000Z",
    "spbuId": null,
    "amtId": null,
    "createdAt": "2026-07-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/change-password
Ganti password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### 6.2 Loading Order Endpoints

#### GET /api/lo
Get semua loading order (requires authentication, role-based).

**Query Parameters:**
- `status` - Filter by status
- `date` - Filter by date
- `spbuId` - Filter by SPBU

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "noLO": "LO-20260722-0001",
      "product": "Pertalite",
      "volume": 8000,
      "date": "2026-07-22T00:00:00.000Z",
      "status": "PENDING",
      "spbu": {
        "id": 1,
        "name": "SPBU 74.951.01",
        "code": "74.951.01"
      },
      "truck": {
        "id": 1,
        "nopol": "DB 8001 AA",
        "capacity": 8000
      },
      "amt": {
        "id": 1,
        "name": "Budi Santoso",
        "nip": "7171010101010001"
      }
    }
  ]
}
```

#### POST /api/lo
Create loading order baru (requires ADMIN or PENGAWAS).

**Request Body:**
```json
{
  "noLO": "LO-20260722-0002",
  "product": "Pertamax",
  "volume": 16000,
  "spbuId": 1,
  "truckId": 2,
  "amtId": 1,
  "secondaryAmtId": 2
}
```

#### GET /api/lo/:id
Get detail loading order by ID.

#### PUT /api/lo/:id
Update loading order (requires ADMIN or PENGAWAS).

#### DELETE /api/lo/:id
Delete loading order (requires ADMIN).

#### GET /api/lo/:id/qr
Get QR code untuk loading order.

### 6.3 Feedback Endpoints

#### POST /api/feedback
Submit feedback dari SPBU (requires SPBU role).

**Request Body:**
```json
{
  "loId": 1,
  "sealCondition": "UTUH",
  "volumeStatus": "SESUAI",
  "visualCondition": "JERNIH",
  "density": 735.5,
  "rating": 5,
  "notes": "BBM dalam kondisi baik",
  "lat": 1.4404,
  "lng": 125.1217
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback berhasil disubmit",
  "data": {
    "id": 1,
    "status": "NORMAL"
  }
}
```

#### GET /api/feedback
Get semua feedback (requires authentication, role-based).

#### GET /api/feedback/:id
Get detail feedback by ID.

### 6.4 AMT Feedback Endpoints

#### POST /api/amt-feedback
Submit feedback dari AMT (requires AMT role).

**Request Body:**
```json
{
  "loId": 1,
  "ratingKeramahan": 5,
  "ratingKooperasi": 4,
  "ratingFasilitas": 5,
  "ratingProses": 4,
  "ratingKeseluruhan": 5,
  "notes": "Pelayanan SPBU sangat baik"
}
```

#### GET /api/amt-feedback
Get semua AMT feedback (requires authentication).

### 6.5 Complaint Endpoints

#### GET /api/complaints
Get semua keluhan (requires authentication).

**Query Parameters:**
- `status` - Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "feedbackId": 1,
      "description": "HIGH PRIORITY: Segel Rusak",
      "reasons": "Segel Rusak",
      "status": "OPEN",
      "resolvedBy": null,
      "resolvedNote": null,
      "resolvedAt": null,
      "feedback": {
        "lo": {
          "noLO": "LO-20260722-0001"
        },
        "spbu": {
          "name": "SPBU 74.951.01"
        }
      }
    }
  ]
}
```

#### PUT /api/complaints/:id/resolve
Resolve keluhan (requires ADMIN or PENGAWAS).

**Request Body:**
```json
{
  "resolvedNote": "Telah ditindaklanjuti"
}
```

### 6.6 Dashboard Endpoints

#### GET /api/dashboard/stats
Get statistik dashboard (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLO": 51,
    "pendingLO": 5,
    "completedLO": 46,
    "totalFeedback": 39,
    "highPriority": 12,
    "totalComplaints": 27,
    "openComplaints": 8,
    "resolvedComplaints": 19
  }
}
```

#### GET /api/dashboard/recent
Get data recent untuk dashboard.

### 6.7 Export Endpoints

#### GET /api/export/feedback
Export feedback ke Excel (requires ADMIN or PENGAWAS).

#### GET /api/export/complaints
Export keluhan ke Excel (requires ADMIN or PENGAWAS).

### 6.8 Notification Endpoints

#### GET /api/notifications
Get notifikasi user (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Loading Order Baru",
      "message": "LO-20260722-0002 telah dibuat",
      "type": "info",
      "isRead": false,
      "link": "/lo/2",
      "createdAt": "2026-07-22T01:00:00.000Z"
    }
  ]
}
```

#### PUT /api/notifications/:id/read
Tandai notifikasi sebagai sudah dibaca.

### 6.9 SPBU Endpoints

#### GET /api/spbu
Get semua SPBU (requires authentication).

#### POST /api/spbu
Create SPBU baru (requires ADMIN or PENGAWAS).

#### PUT /api/spbu/:id
Update SPBU (requires ADMIN or PENGAWAS).

#### DELETE /api/spbu/:id
Delete SPBU (requires ADMIN).

### 6.10 Truck Endpoints

#### GET /api/trucks
Get semua truck (requires authentication).

#### POST /api/trucks
Create truck baru (requires ADMIN or PENGAWAS).

#### PUT /api/trucks/:id
Update truck (requires ADMIN or PENGAWAS).

#### DELETE /api/trucks/:id
Delete truck (requires ADMIN).

### 6.11 AMT Endpoints

#### GET /api/amt
Get semua AMT (requires authentication).

#### POST /api/amt
Create AMT baru (requires ADMIN or PENGAWAS).

#### PUT /api/amt/:id
Update AMT (requires ADMIN or PENGAWAS).

#### DELETE /api/amt/:id
Delete AMT (requires ADMIN).

### 6.12 User Endpoints

#### GET /api/users
Get semua user (requires ADMIN).

#### PUT /api/users/:id
Update user (requires ADMIN).

#### DELETE /api/users/:id
Delete user (requires ADMIN).

---

## 7. FITUR DAN FUNGSIONALITAS

### 7.1 Fitur Authentication

**Deskripsi:**
Sistem login dan registrasi dengan keamanan JWT.

**Flow:**
1. User memasukkan email dan password
2. Backend validasi input
3. Backend cek user di database
4. Backend verifikasi password (bcrypt compare)
5. Backend generate JWT token
6. Backend kirim token ke frontend
7. Frontend simpan token di localStorage
8. Frontend gunakan token untuk setiap request

**Security:**
- Password di-hash dengan bcrypt (12 rounds)
- JWT token dengan expiry 7 hari
- Rate limiting untuk login (5 attempt per 15 menit)
- Input validation dengan Joi

### 7.2 Fitur Loading Order Management

**Deskripsi:**
Manajemen loading order dari pembuatan hingga selesai.

**Flow:**
1. Admin/Pengawas create loading order
2. System generate QR code dan token
3. System notifikasi SPBU dan AMT terkait
4. SPBU scan QR code untuk feedback
5. Status berubah dari PENDING → COMPLETED

**Fitur:**
- Create loading order
- View list loading order
- Filter by status, date, SPBU
- Generate QR code
- Update status
- Delete loading order

### 7.3 Fitur Feedback SPBU

**Deskripsi:**
Sistem feedback dari SPBU untuk kualitas dan kuantitas BBM.

**Parameter yang Dinilai:**
- **Kondisi Segel** (UTUH/RUSAK)
- **Status Volume** (SESUAI/SELISIH)
- **Kondisi Visual** (JERNIH/ADA_AIR/ADA_ENDAPAN)
- **Densitas** (kg/m³, range 715-770)
- **Rating** (1-5)
- **Catatan** (opsional)
- **Foto** (opsional)
- **Lokasi** (latitude, longitude)

**Flow:**
1. SPBU scan QR code loading order
2. SPBU isi form feedback
3. Backend validasi input
4. Backend cek parameter untuk high priority
5. Jika anomali, auto-create complaint
6. Backend simpan feedback
7. Backend notifikasi pengawas

**Deteksi High Priority:**
- Segel RUSAK
- Volume SELISIH
- Visual tidak JERNIH
- Densitas di luar range (715-770)
- Rating ≤ 2

### 7.4 Fitur Feedback AMT

**Deskripsi:**
Sistem rating dari AMT untuk SPBU.

**Parameter yang Dinilai:**
- **Rating Keramahan** (1-5)
- **Rating Kerjasama** (1-5)
- **Rating Fasilitas** (1-5)
- **Rating Proses** (1-5)
- **Rating Keseluruhan** (1-5)
- **Catatan** (opsional)
- **Foto** (opsional)
- **Lokasi** (latitude, longitude)

**Flow:**
1. AMT login ke dashboard khusus
2. AMT pilih loading order yang sudah selesai
3. AMT isi form rating
4. Backend validasi input
5. Backend simpan rating
6. Backend notifikasi pengawas

### 7.5 Fitur Complaint Management

**Deskripsi:**
Sistem keluhan otomatis dan manual.

**Auto-Create Complaint:**
- Dibuat otomatis saat feedback high priority
- Status: OPEN
- Reasons diambil dari parameter yang anomali

**Manual Complaint:**
- Admin/Pengawas bisa create manual
- User bisa report issue

**Flow:**
1. Complaint dibuat (auto atau manual)
2. Backend notifikasi admin/pengawas
3. Admin/Pengawas review complaint
4. Admin/Pengawas assign resolver
5. Resolver investigasi
6. Resolver update status ke IN_PROGRESS
7. Resolver resolve dengan note
8. Status berubah ke RESOLVED
9. Backend notifikasi semua pihak

**Status:**
- **OPEN** - Baru dibuat
- **IN_PROGRESS** - Sedang ditindaklanjuti
- **RESOLVED** - Sudah selesai
- **CLOSED** - Ditutup

### 7.6 Fitur Dashboard

**Deskripsi:**
Dashboard komprehensif untuk monitoring.

**Komponen Dashboard:**
- **Statistik Overview**
  - Total Loading Order
  - Loading Order Pending
  - Loading Order Completed
  - Total Feedback
  - High Priority Feedback
  - Total Complaints
  - Open Complaints
  - Resolved Complaints

- **Recent Loading Orders**
  - List 10 LO terbaru
  - Status, SPBU, Product, Volume

- **Recent Feedback**
  - List 10 feedback terbaru
  - Status, Rating, SPBU

- **Recent Complaints**
  - List 10 keluhan terbaru
  - Status, SPBU, Description

- **Charts/Graphs**
  - Loading Order trend (daily/weekly/monthly)
  - Feedback distribution
  - Complaint status distribution
  - SPBU performance ranking

### 7.7 Fitur Real-time Notification

**Deskripsi:**
Notifikasi real-time menggunakan Socket.IO.

**Event yang Trigger Notifikasi:**
- Loading Order baru dibuat
- Feedback disubmit
- Keluhan baru dibuat
- Keluhan di-resolve
- Status loading order berubah

**Flow:**
1. Event terjadi di backend
2. Backend emit event via Socket.IO
3. Frontend yang connected receive event
4. Frontend update UI
5. Frontend show notification toast

**Socket.IO Rooms:**
- `dashboard` - Untuk monitoring real-time

### 7.8 Fitur Export Data

**Deskripsi:**
Export data ke format Excel.

**Fitur Export:**
- Export Feedback
- Export Complaints
- Export Loading Orders

**Format:**
- Excel (.xlsx)
- Include semua kolom relevant
- Filterable by date range

### 7.9 Fitur Role-Based Access Control

**Deskripsi:**
Akses berbeda berdasarkan role user.

**Role dan Akses:**

| Fitur | ADMIN | PENGAWAS | SPBU | AMT |
|-------|-------|----------|------|-----|
| Login | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create LO | ✅ | ✅ | ❌ | ❌ |
| View All LO | ✅ | ✅ | Own only | Own only |
| Submit Feedback | ❌ | ❌ | ✅ | ❌ |
| Submit AMT Feedback | ❌ | ❌ | ❌ | ✅ |
| View All Feedback | ✅ | ✅ | Own only | Own only |
| Manage Complaints | ✅ | ✅ | ❌ | ❌ |
| Manage SPBU | ✅ | ✅ | ❌ | ❌ |
| Manage Trucks | ✅ | ✅ | ❌ | ❌ |
| Manage AMT | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ |

### 7.10 Fitur Mobile Responsive

**Deskripsi:**
Tampilan responsif untuk mobile device.

**Fitur Mobile:**
- Bottom navigation
- FAB (Floating Action Button) untuk scan QR
- Responsive layout
- Touch-friendly UI
- Mobile-specific dashboard

---

## 8. FLOW SISTEM

### 8.1 Flow Registrasi User SPBU

```
1. User buka halaman registrasi
2. User pilih role SPBU
3. User isi form:
   - Nama
   - Email
   - Password
   - Kode SPBU
4. Frontend kirim data ke backend
5. Backend validasi input
6. Backend cek kode SPBU di database
7. Backend cek apakah SPBU aktif
8. Backend hash password
9. Backend create user dengan role SPBU
10. Backend link user ke SPBU
11. Backend kirim response sukses
12. Frontend redirect ke login
```

### 8.2 Flow Login

```
1. User buka halaman login
2. User masukkan email dan password
3. Frontend kirim data ke backend
4. Backend validasi input
5. Backend cek user di database
6. Backend cek apakah user aktif
7. Backend compare password
8. Backend update last login
9. Backend generate JWT token
10. Backend kirim token dan user data
11. Frontend simpan token di localStorage
12. Frontend redirect ke dashboard sesuai role
```

### 8.3 Flow Create Loading Order

```
1. Admin/Pengawas buka halaman LO
2. Admin/Pengawas klik "Create LO"
3. Admin/Pengawas isi form:
   - Nomor LO
   - Produk
   - Volume
   - SPBU
   - Truck
   - AMT (primary)
   - AMT (secondary, opsional)
4. Frontend kirim data ke backend
5. Backend validasi input
6. Backend create loading order
7. Backend generate QR token
8. Backend generate QR code
9. Backend emit event "new-lo" via Socket.IO
10. Backend kirim response sukses
11. Frontend update list LO
12. Frontend show notifikasi ke SPBU dan AMT
```

### 8.4 Flow Submit Feedback SPBU

```
1. SPBU buka halaman feedback
2. SPBU scan QR code atau pilih LO
3. SPBU isi form feedback:
   - Kondisi segel
   - Status volume
   - Kondisi visual
   - Densitas
   - Rating
   - Catatan (opsional)
   - Foto (opsional)
4. Frontend kirim data ke backend
5. Backend validasi input
6. Backend cek parameter untuk high priority
7. Jika high priority:
   - Backend create complaint otomatis
   - Backend emit event "new-complaint"
8. Backend simpan feedback
9. Backend emit event "new-feedback"
10. Backend kirim response sukses
11. Frontend redirect ke riwayat
12. Frontend show notifikasi ke pengawas
```

### 8.5 Flow Resolve Complaint

```
1. Admin/Pengawas buka halaman keluhan
2. Admin/Pengawas pilih keluhan OPEN
3. Admin/Pengawas klik "Resolve"
4. Admin/Pengawas isi catatan resolusi
5. Frontend kirim data ke backend
6. Backend validasi input
7. Backend update complaint status ke RESOLVED
8. Backend simpan resolved note dan timestamp
9. Backend emit event "complaint-resolved"
10. Backend kirim response sukses
11. Frontend update list keluhan
12. Frontend show notifikasi ke semua pihak
```

---

## 9. KEAMANAN SISTEM

### 9.1 Authentication

**JWT Token:**
- Token berisi userId dan role
- Expiry: 7 hari
- Secret key dari environment variable
- Stored di localStorage (frontend)

**Password Hashing:**
- Algoritma: bcrypt
- Salt rounds: 12
- Password tidak disimpan dalam plain text

### 9.2 Authorization

**Role-Based Access Control:**
- Middleware cek role user
- Setiap endpoint punya role requirement
- Unauthorized access return 403 Forbidden

**Middleware Flow:**
```
Request → Authenticate (verify JWT) → Authorize (check role) → Controller
```

### 9.3 Input Validation

**Validation dengan Joi:**
- Semua input divalidasi sebelum diproses
- Error message dalam bahasa Indonesia
- Validasi tipe data, format, dan range

### 9.4 Rate Limiting

**Global Rate Limit:**
- 100 request per 15 menit per IP
- Mencegah DDoS attack

**Auth Rate Limit:**
- 5 login attempt per 15 menit per IP
- Mencegah brute force attack

### 9.5 Security Headers

**Helmet Middleware:**
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options (DENY)
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### 9.6 File Upload Security

**Validation:**
- Hanya izinkan: JPG, JPEG, PNG, WebP
- Maksimal ukuran: 5MB
- Sanitasi filename
- Validasi MIME type dan extension

### 9.7 CORS Protection

**CORS Configuration:**
- Origin: Frontend URL only
- Methods: GET, POST, PUT, DELETE, PATCH
- Headers: Content-Type, Authorization
- Credentials: enabled
- Max-age: 24 hours

### 9.8 Database Security

**PostgreSQL Security:**
- Password user tidak di .env (gunakan environment variable)
- Connection string tidak di-hardcode
- Prisma ORM mencegah SQL injection

### 9.9 Backup System

**Automated Backup:**
- Script backup: `npm run backup`
- Simpan di folder `backups`
- Keep last 7 backups
- Format: SQL dump

---

## 10. KONFIGURASI ENVIRONMENT

### 10.1 Backend Environment Variables

File: `backend/.env`

```env
# Server
PORT=5002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/qpass_bitung

# JWT
JWT_SECRET="random_secret_key_here"
JWT_EXPIRES_IN="7d"

# Frontend URL
FRONTEND_URL=http://localhost:3001

# SMTP (Email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
NOTIFY_EMAIL=""

# FONNTE (SMS)
FONNTE_TOKEN=""
FONNTE_TARGET=""

# Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880

# QR Code
QR_BASE_URL=http://localhost:3001/feedback
```

### 10.2 Frontend Environment Variables

File: `frontend/.env`

```env
VITE_API_URL=http://localhost:5002
VITE_SOCKET_URL=http://localhost:5002
```

---

## 11. PENGUJIAN SISTEM

### 11.1 Pengujian Fungsional

**Test Case:**
1. Login dengan credentials valid
2. Login dengan credentials invalid
3. Create loading order
4. Submit feedback SPBU
5. Submit feedback AMT
6. Create complaint manual
7. Resolve complaint
8. Export data
9. Notifikasi real-time
10. Role-based access

### 11.2 Pengujian Performa

**Metric:**
- Response time API < 500ms
- Page load time < 3s
- Database query time < 100ms
- Socket.IO latency < 100ms

### 11.3 Pengujian Keamanan

**Test Case:**
1. SQL injection attempt
2. XSS attempt
3. CSRF attempt
4. Brute force login
5. Unauthorized access attempt
6. File upload malicious

---

## 12. DEPLOYMENT

### 12.1 Backend Deployment

**Steps:**
1. Setup VPS dengan Ubuntu
2. Install Node.js
3. Install PostgreSQL
4. Clone repository
5. Install dependencies: `npm install`
6. Setup environment variables
7. Run migrations: `npx prisma db push`
8. Seed database: `npm run db:seed`
9. Install PM2: `npm install -g pm2`
10. Start with PM2: `pm2 start src/server.js --name qpass-backend`
11. Setup Nginx reverse proxy
12. Setup SSL dengan Let's Encrypt

### 12.2 Frontend Deployment

**Steps:**
1. Build frontend: `npm run build`
2. Deploy ke Vercel/Netlify atau VPS
3. Setup environment variables
4. Configure domain
5. Setup SSL

---

## 13. LIMITASI SISTEM

1. Tidak ada mobile native app
2. Tidak ada offline mode
3. Tidak ada integrasi SAP/ERP
4. Tidak ada payment gateway
5. Tidak ada multi-language support
6. Tidak ada advanced analytics
7. Tidak ada 2FA (belum diimplementasi)
8. Tidak ada audit logging (belum diimplementasi)

---

## 14. PENGEMBANGAN MASA DEPAN

1. Implement 2FA dengan Google Authenticator
2. Implement audit logging lengkap
3. Integrasi dengan SAP/ERP Pertamina
4. Mobile native app (iOS/Android)
5. Offline mode dengan PWA
6. Advanced analytics dengan BI tools
7. Multi-language support
8. AI untuk anomaly detection
9. Blockchain untuk audit trail
10. Multi-region deployment

---

**Dokumentasi ini dibuat untuk mendukung penulisan skripsi/TA tentang sistem Q-Pass Bitung.**
