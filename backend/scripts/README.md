# Backend Development & Maintenance Scripts

Direktori ini berisi script utilitas yang digunakan selama proses pengembangan, pengujian internal, dan pemeliharaan basis data aplikasi **Q-Pass Bitung**.

---

## 📂 Kategori Script

### 1. Database Maintenance & Seeding
* `backup-db.js`: Utilitas backup data PostgreSQL secara terprogram.
* `clear-data-keep-spbu.js`: Membersihkan data transaksi simulasi tanpa menghapus data master SPBU.
* `clear-data.js`: Reset data transaksi testing.
* `inspect-db-counts.js`: Memeriksa jumlah baris data pada setiap tabel Prisma.

### 2. User & Master Data Management
* `create-amt-direct.js` / `create-amt-user.js` / `create-amt-via-api.js`: Helper pembuatan akun dan data master Awak Mobil Tangki (AMT).
* `check-users.js`: Menampilkan daftar pengguna terdaftar dan relasi role-nya.
* `update-passwords.js` / `update-usernames.js`: Utilitas sinkronisasi hash password dan username untuk testing lokal.
* `check-spbu-coords.js` / `update-spbu-coords.js`: Pengecekan dan kalibrasi koordinat GPS SPBU di area Bitung & sekitarnya.

### 3. API & Connectivity Verification
* `test-api.js`: Pengujian ketersediaan endpoint backend.
* `test-login.js` / `test-register.js`: Simulasi alur autentikasi JWT pengguna.
* `test-user-stats.js`: Verifikasi agregasi statistik dashboard.
* `clear-active-locations.js`: Membersihkan status live location AMT yang kadaluarsa/stale.

---

## ⚙️ Cara Menjalankan Script
Jalankan script dari folder `backend/` menggunakan Node.js:
```bash
cd backend
node scripts/<nama-script>.js
```
*Catatan: Pastikan environment variable di file `.env` sudah terkonfigurasi dengan benar sebelum mengeksekusi script database.*
