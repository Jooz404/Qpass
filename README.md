# Q-PASS BITUNG ⛽
### Sistem Monitoring Kualitas & Kuantitas Distribusi BBM Terpadu
**PT Pertamina Patra Niaga — Integrated Terminal / Fuel Terminal Bitung (Divisi Quality & Quantity)**

[![Status](https://img.shields.io/badge/Status-In_Production-success?style=flat-square&logo=statuspage&logoColor=white)](https://qpass.my.id)
[![Live URL](https://img.shields.io/badge/Production_URL-qpass.my.id-007ACC?style=flat-square&logo=googlechrome&logoColor=white)](https://qpass.my.id)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Nginx](https://img.shields.io/badge/Reverse_Proxy-Nginx-009639?style=flat-square&logo=nginx&logoColor=white)](https://nginx.org/)
[![PM2](https://img.shields.io/badge/Process_Manager-PM2-2B037A?style=flat-square&logo=pm2&logoColor=white)](https://pm2.keymetrics.io/)

---

## 📌 Ringkasan Eksekutif (Overview)

Aplikasi **Q-Pass** adalah sistem operasional *end-to-end* yang beroperasi secara langsung di lingkungan produksi (*production-ready*) untuk mendigitalisasi dan memusatkan seluruh alur kerja pengawasan mutu dan kuantitas Bahan Bakar Minyak (BBM) pada **Divisi Quality & Quantity (QQ) PT Pertamina Patra Niaga FT Bitung**.

Sebelumnya, proses pencatatan penerimaan kapal, penerbitan surat jalan/LO, hingga tanda terima SPBU dilakukan secara manual berbasis kertas. Q-Pass menggantikan proses terfragmentasi tersebut dengan platform web terintegrasi yang menjamin integritas mutu (*quality*), akurasi volume (*quantity*), serta keterlacakan distribusi secara *real-time*.

* **Status:** In Production  
* **Hosting:** Self-hosted Linux VPS (Ubuntu 24.04 LTS)  
* **Production Domain:** [https://qpass.my.id](https://qpass.my.id)  
* **Backend Runtime:** Node.js v20 LTS / Express.js / Socket.IO / Prisma ORM  
* **Frontend Runtime:** React 18 SPA / Vite / Tailwind CSS  
* **Database:** PostgreSQL 16+ Relational Database  

---

## 🌐 Live Production Application

Aplikasi saat ini aktif dan melayani operasional distribusi:
* **Production URL:** [https://qpass.my.id](https://qpass.my.id)

> **Catatan Keamanan & Hak Akses:**  
> Akses ke sistem produksi dilindungi oleh mekanisme autentikasi *Role-Based Access Control* (RBAC) dengan enkripsi JWT. Pengguna umum hanya dapat mengakses halaman informasi publik/landing page; akses ke modul manajerial, monitoring, dan input data terbatas hanya untuk personel berwenang Pertamina serta perwakilan SPBU terdaftar.

---

## 🚀 Fitur Utama (Key Features)

### 1. Monitoring Armada & GPS Tracking Real-Time
* **Live Fleet Map**: Visualisasi posisi GPS armada Mobil Tangki (AMT) secara langsung di peta digital.
* **Status Pengiriman**: Pelacakan siklus status (*Assigned*, *In Transit*, *Arrived*, *Completed*).
* **Deduplikasi Rute**: Algoritma penyaringan posisi terkini untuk mencegah penumpukan jejak koordinat kadaluarsa.

### 2. Manajemen Loading Order (LO) & Verifikasi QR Code
* **Multi-Produk BBM**: Pengelolaan LO untuk ragam komoditas BBM (Pertalite, Pertamax, Solar B50, Dexlite, Avtur, Kerosene).
* **Dynamic QR Code**: Setiap LO dilengkapi barcode QR unik terenkripsi untuk validasi serah terima di SPBU tanpa kontak fisik.
* **Audit Trail**: Riwayat penerbitan, kuantitas volume (L), kompartemen tangki, dan tanggal pemuatan.

### 3. Quality Control (QC) & Penerimaan Kapal (Vessel Discharge)
* **CQD Digital**: Pencatatan sertifikat mutu kargo kapal (*Certificate of Quality Discharge*).
* **Uji Laboratorium**: Validasi parameter teknis laboratorium Ditjen Migas (Density 15°C, Temperature, Flash Point, Water Content, Appearance).
* **Approval Workflow**: Persetujuan bertingkat oleh Pengawas QQ sebelum produk dialirkan ke tangki timbun terminal.

### 4. Evaluasi & Feedback SPBU (Customer Satisfaction)
* **Scan & Verify**: Operator SPBU memindai QR LO saat truk tiba untuk memastikan integritas segel dan volume.
* **Rating & Feedback**: Penilaian performa pelayanan AMT (ketepatan waktu, keramahan, kepatuhan HSE).
* **Ticketing Komplain**: Pelaporan ketidaksesuaian mutu atau volume disertai unggahan bukti foto fisik.

### 5. Role-Based Access Control (RBAC)
* **Administrator**: Konfigurasi sistem, manajemen akun pengguna, data master SPBU & armada, serta rekapitulasi data.
* **Pengawas (QQ & Operasi)**: Monitoring sebaran armada, approval inspeksi QC, pemantauan kapal, dan analisis komplain.
* **Operator SPBU**: Konfirmasi penerimaan BBM, input rating AMT, dan riwayat penerimaan LO.
* **Driver AMT**: Akses surat tugas digital, navigasi rute penugasan, dan konfirmasi tiba di tujuan.

---

## 🏗️ Arsitektur Sistem Produksi

```text
               [ Pengguna / Browser / Mobile AMT ]
                               │
                               │ HTTPS / WSS (Port 443 / 80)
                               ▼
            ┌──────────────────────────────────────┐
            │         Nginx Reverse Proxy          │
            │   - SSL/TLS Termination              │
            │   - Cache Header & Compression       │
            │   - Static File Serving (/var/www)   │
            │   - WebSocket Upgrade Proxy          │
            └──────────┬────────────────┬──────────┘
                       │                │
          Static Files │                │ API & Socket.io (/api, /socket.io)
                       ▼                ▼
        ┌─────────────────────┐   ┌──────────────────────────────┐
        │ React Frontend SPA  │   │     Node.js Express API      │
        │ (Vite Production)   │   │  (PM2 Cluster: Port 5000)    │
        └─────────────────────┘   └──────────────┬───────────────┘
                                                 │
                                                 │ Prisma ORM (Port 5432)
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │      PostgreSQL 16 DB        │
                                  │   (Database: qpass_bitung)   │
                                  └──────────────────────────────┘
```

---

## 📁 Struktur Repositori

```text
qpass-deploy/
├── backend/                  # REST API & WebSocket Server
│   ├── prisma/               # Skema ORM database & file seeder
│   │   ├── schema.prisma     # Definisi model data relasional
│   │   └── seed.js           # Seeder akun default 1 user per role
│   ├── scripts/              # Utilitas dev & database maintenance
│   │   └── README.md         # Dokumentasi daftar script pemeliharaan
│   ├── src/
│   │   ├── lib/              # Inisialisasi Prisma Client & helper
│   │   ├── middleware/       # Autentikasi JWT, validasi, Multer upload
│   │   ├── routes/           # Endpoint API per domain fitur (LO, QC, SPBU, dll.)
│   │   └── server.js         # Entry point backend server
│   ├── .env.example          # Template konfigurasi environment backend
│   └── package.json
│
├── frontend/                 # Web Application (React SPA)
│   ├── public/               # Favicon & logo statis
│   ├── src/
│   │   ├── components/       # UI Komponen reusable, navbar, modals
│   │   ├── context/          # Global state (AuthContext, Theme, Toast)
│   │   ├── pages/            # Halaman fitur terbagi berdasarkan role
│   │   └── services/         # API client Axios & WebSocket hooks
│   ├── .env.example          # Template konfigurasi environment frontend
│   └── package.json
│
├── deployment/               # Konfigurasi Nginx Server Block (qpass.my.id)
├── ecosystem.config.js       # Konfigurasi PM2 Process Manager Produksi
├── DEPLOYMENT.md             # Panduan operasional & deployment server VPS
└── README.md                 # Dokumentasi utama repositori
```

---

## 💻 Panduan Menjalankan Secara Lokal (Local Development)

### Prasyarat
* **Node.js**: v20.x atau lebih baru
* **NPM**: v10.x atau lebih baru
* **PostgreSQL**: v15.x atau v16.x aktif di mesin lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/Jooz404/Qpass.git
cd Qpass
```

### 2. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Konfigurasi environment lokal
cp .env.example .env
```
> *Edit file `backend/.env` dan arahkan `DATABASE_URL` ke database PostgreSQL lokal Anda (misal: `postgresql://postgres:password@localhost:5432/qpass_dev`).*

```bash
# Generate Prisma Client & buat struktur tabel
npx prisma generate
npx prisma db push

# Eksekusi seeder akun pengujian
node prisma/seed.js

# Jalankan backend API
npm run dev
```

#### Kredensial Akun Seeder Pengujian:
| No | Peran (Role) | Email Login | Password Default |
|---|---|---|---|
| 1 | **Administrator** | `admin@qpass.com` | `admin123` |
| 2 | **Pengawas** | `pengawas@qpass.com` | `admin123` |
| 3 | **Operator SPBU** | `spbu@qpass.com` | `admin123` |
| 4 | **Driver AMT** | `amt@qpass.com` | `admin123` |

### 3. Setup Frontend
Buka terminal baru pada direktori proyek:
```bash
cd frontend

# Install dependencies
npm install

# Buat file environment lokal
cp .env.example .env

# Jalankan Vite development server
npm run dev
```
Aplikasi lokal dapat diakses melalui peramban web di: `http://localhost:3000` atau `http://localhost:5173`.

---

## 🚀 Alur Deployment & Operasional Produksi (Production Operations)

Proses pembaruan (*deployment update*) di server VPS mengikuti standar berikut:

1. **Pull Kode Terbaru**:
   ```bash
   cd /root/home/qpass
   git pull origin main
   ```
2. **Update Backend**:
   ```bash
   cd backend
   npm install --omit=dev
   npx prisma generate
   npx prisma db push
   pm2 reload qpass-backend
   ```
3. **Build Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run build
   cp -rf dist/* /var/www/qpass/
   ```
4. **Verifikasi Service**:
   ```bash
   pm2 status
   curl -i http://127.0.0.1:5000/api/health
   ```

*Panduan lengkap arsitektur server, konfigurasi Nginx reverse proxy, dan recovery database dapat dilihat pada dokumen: [DEPLOYMENT.md](./DEPLOYMENT.md).*

---

## 🔒 Keamanan & Operasional (Security & Operations)

* **Zero Credential in VCS**: Seluruh token rahasia, kata sandi basis data, dan kunci API **tidak pernah** disimpan dalam version control Git. Seluruh variabel dikonfigurasi melalui file `.env` di lingkungan masing-masing.
* **Enkripsi End-to-End**: Seluruh lalu lintas data produksi, transmisi WebSocket, dan pengunggahan berkas berjalan melalui protokol aman HTTPS/WSS dengan sertifikat SSL/TLS.
* **Sanitasi Aset & Upload**: Folder artefak kompilasi (`dist/`) dan berkas unggahan bukti (`uploads/`) diisolasi dan diabaikan oleh Git guna mencegah kontaminasi repositori dan menjaga keamanan data sensitif.
* **Process Persistence & Self-Healing**: Backend dikelola melalui PM2 dengan fitur auto-restart saat terjadi *crash* atau *unhandled exception*, serta auto-booting saat server VPS mengalami *reboot*.

---

## ⚠️ Batasan Operasional Saat Ini (Known Limitations)

1. **Akurasi GPS Mobile Driver**: Akurasi pelacakan posisi Mobil Tangki bergantung pada izin sensor GPS browser dan ketersediaan sinyal seluler sepanjang rute distribusi darat di Sulawesi Utara.
2. **Konektivitas WebSocket**: Jika koneksi jaringan perangkat pengguna terputus di area tanpa sinyal (*blank spot*), sistem secara otomatis melakukan *fallback* ke HTTP polling saat konektivitas kembali stabil.

---

## 🗺️ Rencana Pengembangan (Roadmap)

- [ ] **Otomasi CI/CD Pipeline**: Integrasi GitHub Actions untuk *auto-deploy* ke server VPS saat commit di-push ke branch `main`.
- [ ] **Kalkulasi Standar ASTM Table 54B**: Perhitungan otomatis konversi volume BBM dari suhu observasi lapangan ke suhu standar 15°C.
- [ ] **PWA Offline Mode**: Peningkatan kapabilitas *Progressive Web App* agar formulir inspeksi QC dan checklist AMT dapat diisi saat offline dan otomatis tersinkronisasi saat online.
- [ ] **Integrasi API MyPertamina & SAP**: Sinkronisasi data manifest LO dengan sistem logistik pusat Pertamina.
- [ ] **Automated Test Suite**: Penerapan automated unit & integration testing menggunakan Jest dan Supertest pada endpoint backend kritis.

---

## 👥 Pengembang & Pemelihara (Maintainer)

**Divisi Quality & Quantity (QQ)**  
*Integrated Terminal Bitung — PT Pertamina Patra Niaga Regional Sulawesi*

* **Lead Developer / Maintainer:** Josua Dame ([@Jooz404](https://github.com/Jooz404))
* **Repository:** [https://github.com/Jooz404/Qpass](https://github.com/Jooz404/Qpass)

---

## 📄 Lisensi & Kerahasiaan (Confidentiality Notice)

Dokumentasi dan kode sumber ini merupakan bagian dari sistem operasional internal **PT Pertamina Patra Niaga**.  
*Confidential & Proprietary. All rights reserved.* Dilarang memperbanyak, mendistribusikan, atau menyalahgunakan tanpa izin tertulis dari pihak PT Pertamina Patra Niaga.
