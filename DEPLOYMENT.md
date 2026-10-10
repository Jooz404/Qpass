# Panduan & Dokumentasi Deployment VPS - Q-Pass Bitung

Dokumen ini berisi panduan teknis lengkap mengenai arsitektur, konfigurasi, dan langkah-langkah deployment aplikasi **Q-Pass Bitung** di VPS Linux (Ubuntu 24.04 LTS).

---

## 1. Arsitektur & Informasi Server

* **IP Server VPS**: `103.253.213.97`
* **Domain Utama**: `qpass.my.id` (dan `www.qpass.my.id`)
* **Sistem Operasi**: Ubuntu 24.04 LTS
* **Database**: PostgreSQL 16+ (Port `5432`, Database: `qpass_bitung`, User: `myuser`)
* **Backend API**: Node.js v20 / Express.js / Socket.IO / Prisma ORM (PM2 Process: `qpass-backend`, Port `5000`)
* **Frontend Web**: React + Vite SPA (Di-build dan disajikan statis di `/var/www/qpass`)
* **Web Server / Reverse Proxy**: Nginx (Port `80`)

---

## 2. Struktur Direktori di VPS

```text
/root/home/qpass/
├── backend/                  # Source code Node.js Backend API
│   ├── .env                  # Environment variables produksi
│   ├── src/                  # Controller, routes, middleware, server.js
│   ├── prisma/               # Schema database Prisma & seeder
│   └── uploads/              # Folder penyimpanan file upload (bukti/lampiran)
├── frontend/                 # Source code React Frontend
│   └── dist/                 # Hasil build statis Vite (di-copy ke /var/www/qpass)
├── ecosystem.config.js       # Konfigurasi PM2 Process Manager
└── qpass_bitung_backup.sql   # File backup awal database PostgreSQL

/var/www/qpass/               # Folder publik tempat Nginx membaca file Frontend
/etc/nginx/sites-available/   # File konfigurasi Nginx (qpass.my.id)
```

---

## 3. Konfigurasi Sistem & File Kunci

### A. Environment Backend (`/root/home/qpass/backend/.env`)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://myuser:123@127.0.0.1:5432/qpass_bitung
JWT_SECRET="qpass_bitung_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="7d"

FRONTEND_URL=https://qpass.my.id
QR_BASE_URL=https://qpass.my.id/feedback

UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880
```

### B. Environment Frontend (`/root/home/qpass/frontend/.env`)
```env
VITE_API_URL=https://qpass.my.id/api
```

### C. Konfigurasi PM2 (`/root/home/qpass/ecosystem.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'qpass-backend',
      script: 'src/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
```

### D. Konfigurasi Nginx (`/etc/nginx/sites-available/qpass.my.id`)
```nginx
server {
    listen 80;
    server_name qpass.my.id www.qpass.my.id 103.253.213.97 _;

    # Frontend Single Page Application (Vite build)
    root /var/www/qpass;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests ke Backend Node.js (Port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket (Socket.io)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Storage Folder Upload File
    location /uploads/ {
        alias /root/home/qpass/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 4. Langkah-Langkah Deployment (Lengkap dari Awal)

### Langkah 1: Persiapan Database PostgreSQL
```bash
# Masuk ke psql sebagai user postgres
sudo -u postgres psql

# Buat user & database
CREATE DATABASE qpass_bitung;
CREATE USER myuser WITH PASSWORD '123';
GRANT ALL PRIVILEGES ON DATABASE qpass_bitung TO myuser;
\q

# Restore database jika ada file backup .sql
sudo -u postgres psql -d qpass_bitung -f /root/home/qpass/qpass_bitung_backup.sql
```

### Langkah 2: Setup Backend Node.js & Prisma
```bash
cd /root/home/qpass/backend

# Install dependensi backend
npm install

# Generate Prisma Client & sinkronisasi skema
npx prisma generate
npx prisma db push

# Jalankan Backend via PM2
cd /root/home/qpass
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Langkah 3: Build & Deploy Frontend React
```bash
cd /root/home/qpass/frontend

# Install dependensi & build project
npm install
npm run build

# Pindahkan file hasil build ke folder publik Nginx
mkdir -p /var/www/qpass
cp -rf /root/home/qpass/frontend/dist/* /var/www/qpass/
chown -R www-data:www-data /var/www/qpass
chmod -R 755 /var/www/qpass
```

### Langkah 4: Setup Nginx Web Server
```bash
# Install Nginx (jika belum terinstall)
sudo apt update && sudo apt install -y nginx

# Aktifkan konfigurasi situs Nginx
ln -sf /etc/nginx/sites-available/qpass.my.id /etc/nginx/sites-enabled/default

# Uji konfigurasi Nginx
nginx -t

# Restart / Reload service Nginx
systemctl reload nginx
```

---

## 5. Perintah Pemeliharaan & Monitoring (Opsional)

### A. Mengecek Status Aplikasi
* **Status PM2 Backend**: `pm2 status`
* **Log Backend**: `pm2 logs qpass-backend --lines 50`
* **Status Service Nginx**: `systemctl status nginx`
* **Status Service Database**: `systemctl status postgresql`

### B. Menguji Response Endpoint (Health Check)
```bash
# Cek backend internal
curl -i http://127.0.0.1:5000/api/health

# Cek via Nginx reverse proxy
curl -i http://127.0.0.1/api/health
```

### C. Troubleshooting Umum
1. **PM2 Restart Continuous / Error EADDRINUSE**:
   Pastikan tidak ada process orphaned yang mengunci port `5000` atau `5002`. Jalankan `npx kill-port 5000` atau `pm2 delete all && pm2 start ecosystem.config.js`.
2. **Error 500 Internal Server Error Nginx pada Frontend**:
   Disebabkan oleh permission folder `/root`. Pastikan file frontend dibaca dari `/var/www/qpass` dan memiliki izin `chmod -R 755 /var/www/qpass`.
3. **Database Error P1000 (Authentication Failed)**:
   Pastikan password PostgreSQL user `myuser` sudah di-set sesuai di `.env` (`ALTER USER myuser WITH PASSWORD '123';`).
