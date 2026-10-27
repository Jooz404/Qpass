# Q-PASS BITUNG ⛽
### Sistem Monitoring Kualitas & Kuantitas Distribusi BBM Terpadu
**PT Pertamina Patra Niaga — Fuel Terminal Bitung (Divisi Quality & Quantity)**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Ringkasan Eksekutif

**Q-Pass** adalah platform monitoring operasional end-to-end yang dikembangkan untuk Divisi **Quality & Quantity (QQ) PT Pertamina Patra Niaga Fuel Terminal Bitung**. Sistem ini dirancang untuk mendigitalisasi, memantau, dan memastikan integritas mutu serta volume Bahan Bakar Minyak (BBM) mulai dari tahap penerimaan kargo kapal (*Vessel Discharge*), pengisian ke Mobil Tangki (*Loading Order*), distribusi real-time oleh Awak Mobil Tangki (AMT), hingga serah terima di SPBU penerima.

---

## 🚀 Fitur Utama

### 1. Monitoring Armada & GPS Tracking Real-Time
* Peta interaktif pemantauan posisi GPS Mobil Tangki (AMT) secara langsung.
* Status pengiriman (*Assigned*, *In Transit*, *Arrived*, *Completed*).
* Deteksi anomali keterlambatan dan riwayat jejak rute pengiriman.

### 2. Manajemen Loading Order (LO) & Verifikasi QR Code
* Pembuatan dan penerbitan Loading Order digital dengan rincian produk (Pertalite, Pertamax, Solar B50, Dexlite, Avtur, Kerosene).
* *Dynamic QR Code Generator* pada setiap LO untuk validasi serah terima di SPBU tanpa kontak.

### 3. Quality Control (QC) & Penerimaan Kapal (Vessel Discharge)
* Pencatatan sertifikasi mutu kargo kapal (*Certificate of Quality Discharge* / CQD).
* Rekam parameter uji laboratorium (Density, Temperature, Flash Point, Water Content, Appearance).
* Validasi ambang batas spesifikasi teknis BBM Ditjen Migas.

### 4. Sistem Feedback & Rating Pelayanan SPBU
* SPBU melakukan pemindaian QR LO saat armada tiba.
* Form evaluasi integritas pengiriman (segel tangki, kuantitas, kesopanan AMT, dan ketepatan waktu).
* Modul eskalasi komplain mutu BBM dengan unggah bukti foto.

### 5. Multi-Role Role-Based Access Control (RBAC)
* **Administrator**: Akses manajerial penuh (kelola user, SPBU, armada truk, data master, dan rekap statistik).
* **Pengawas (QQ & Operasi)**: Monitoring peta sebaran, validasi QC lab, inspeksi kapal, dan analisis komplain.
* **Operator SPBU**: Akses tanda terima LO, input feedback penerimaan, dan history pengiriman.
* **Driver AMT**: Dashboard rute penugasan, panduan navigasi, dan update checklist operasional.

---

## 🏗️ Arsitektur Teknologi

```text
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│     React 18 (SPA) + Vite + Tailwind CSS + Socket.IO Client │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / WebSocket (Port 80/443)
┌──────────────────────────────▼──────────────────────────────┐
│                    Reverse Proxy & Web Server                │
│             Nginx (SSL Termination & Static Assets)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Proxy Pass (Port 5000)
┌──────────────────────────────▼──────────────────────────────┐
│                       Backend API                           │
│        Node.js + Express.js + Socket.IO + Prisma ORM        │
└──────────────────────────────┬──────────────────────────────┘
                               │ PostgreSQL Protocol (Port 5432)
┌──────────────────────────────▼──────────────────────────────┐
│                     Database Layer                          │
│                 PostgreSQL 16 (Relational DB)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Repositori

```text
qpass/
├── backend/                  # REST API & WebSocket Server (Node.js/Express)
│   ├── prisma/               # Skema ORM database & seeder
│   ├── scripts/              # Utilitas dev & database maintenance
│   ├── src/
│   │   ├── middleware/       # Autentikasi JWT, validasi, upload
│   │   ├── routes/           # REST endpoints per domain fitur
│   │   └── server.js         # Entry point backend server
│   ├── .env.example          # Template konfigurasi environment backend
│   └── package.json
│
├── frontend/                 # Web Application (React SPA + Vite)
│   ├── public/               # Favicon & aset gambar statis
│   ├── src/
│   │   ├── components/       # Reusable UI components & modals
│   │   ├── context/          # State management (Auth, Theme, Toast)
│   │   ├── pages/            # View halaman berdasarkan fitur & role
│   │   └── services/         # HTTP Client (Axios) & endpoint calls
│   ├── .env.example          # Template konfigurasi environment frontend
│   └── package.json
│
├── deployment/               # Konfigurasi Nginx Server Block
├── ecosystem.config.js       # Konfigurasi PM2 Process Manager
├── DEPLOYMENT.md             # Panduan deployment server produksi Linux
└── README.md                 # Dokumentasi utama repositori
```

---

## 💻 Panduan Instalasi Lokal (Quickstart)

### Prasyarat Sistem
* **Node.js**: v20.x atau lebih baru
* **NPM**: v10.x atau lebih baru
* **PostgreSQL**: v15.x atau v16.x terpasang dan aktif

### 1. Clone Repositori
```bash
git clone https://github.com/Jooz404/Qpass.git
cd Qpass
```

### 2. Setup Backend
```bash
cd backend

# Install dependensi
npm install

# Buat file environment lokal
cp .env.example .env
```
> *Buka file `backend/.env` dan sesuaikan koneksi database `DATABASE_URL` ke PostgreSQL lokal Anda.*

```bash
# Sinkronkan skema database dengan Prisma
npx prisma generate
npx prisma db push

# (Opsional) Jalankan seeder akun testing
npm run seed
```

Akun default seeder:
| Role | Email | Password |
|---|---|---|
| Admin | `admin@qpass.com` | `admin123` |
| Pengawas | `pengawas@qpass.com` | `admin123` |
| Operator SPBU | `spbu@qpass.com` | `admin123` |
| Driver AMT | `amt@qpass.com` | `admin123` |

```bash
# Jalankan backend (Port default 5002 / 5000)
npm run dev
```

### 3. Setup Frontend
Buka terminal baru:
```bash
cd frontend

# Install dependensi
npm install

# Buat file environment frontend
cp .env.example .env

# Jalankan server development Vite
npm run dev
```
Akses aplikasi melalui browser di: `http://localhost:3000` atau `http://localhost:5173`.

---

## 🔒 Praktik Keamanan & Kode Etik Repositori

1. **Zero Credential Policy**: Repositori ini tidak menyimpan kredensial database, JWT Secret, maupun API Key publik. Semua konfigurasi rahasia dikelola secara independen melalui file `.env` di lingkungan deployment masing-masing.
2. **Sanitized Uploads & Builds**: Folder output build (`dist/`) dan file upload pengguna (`uploads/`) diabaikan oleh Git guna menjaga kebersihan riwayat commit dan efisiensi ukuran repositori.
3. **Standar Komit**: Mengikuti format *Conventional Commits* (`feat:`, `fix:`, `chore:`, `style:`, `refactor:`).

---

## 📄 Deployment Produksi
Petunjuk lengkap mengenai setup VPS Linux (Ubuntu), konfigurasi Nginx reverse proxy, setup SSL/HTTPS, dan PM2 service manager dapat dilihat pada dokumen:  
👉 **[Panduan Deployment VPS (DEPLOYMENT.md)](./DEPLOYMENT.md)**

---

<p align="center">
  <b>Divisi Quality & Quantity (QQ) — Integrated Terminal Bitung</b><br>
  PT Pertamina Patra Niaga Regional Sulawesi
</p>
