# Panduan & Dokumentasi Deployment VPS - Q-Pass Bitung

Dokumen ini berisi panduan teknis mengenai arsitektur, konfigurasi lingkungan, dan langkah-langkah deployment aplikasi **Q-Pass Bitung** pada server VPS Linux (Ubuntu 24.04 LTS).

---

## 1. Arsitektur & Spesifikasi Server

* **Sistem Operasi**: Ubuntu 24.04 LTS (atau versi Linux modern yang kompatibel)
* **Web Server / Reverse Proxy**: Nginx (Port `80` / `443`)
* **Backend Runtime**: Node.js v20+ / Express.js / Socket.IO / Prisma ORM
* **Process Manager**: PM2 (`qpass-backend`, Port default `5000`)
* **Frontend Web**: React + Vite SPA (di-build dan disajikan statis di `/var/www/qpass`)
* **Database**: PostgreSQL 16+ (Port default `5432`)

---

## 2. Struktur Direktori di Server

```text
/root/home/qpass/
├── backend/                  # Source code Node.js Backend API
│   ├── .env                  # Environment variables produksi (tidak ditrack di git)
│   ├── src/                  # Controller, routes, middleware, server.js
│   ├── prisma/               # Schema database Prisma & seeder
│   └── uploads/              # Folder penyimpanan file upload (bukti/lampiran)
├── frontend/                 # Source code React Frontend
│   ├── .env                  # Environment variables frontend produksi
│   └── dist/                 # Hasil build statis Vite (di-copy ke /var/www/qpass)
├── deployment/               # Konfigurasi Nginx
└── ecosystem.config.js       # Konfigurasi PM2 Process Manager

/var/www/qpass/               # Direktori publik Nginx untuk file Frontend
/etc/nginx/sites-available/   # Konfigurasi Nginx server block
```

---

## 3. Konfigurasi Lingkungan (Environment Variables)

### A. Backend (`backend/.env`)
Salin dari `backend/.env.example` lalu sesuaikan dengan kredensial server produksi:

```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@127.0.0.1:5432/qpass_bitung
JWT_SECRET="<GENERATE_SECURE_RANDOM_SECRET_KEY>"
JWT_EXPIRES_IN="7d"

FRONTEND_URL=https://qpass.my.id
QR_BASE_URL=https://qpass.my.id/feedback

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="<EMAIL_PENGIRIM>"
SMTP_PASS="<APP_PASSWORD_EMAIL>"
NOTIFY_EMAIL="<EMAIL_NOTIFIKASI>"

UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880
```

### B. Frontend (`frontend/.env`)
Salin dari `frontend/.env.example`:

```env
VITE_API_URL=https://qpass.my.id/api
VITE_GOOGLE_MAPS_API_KEY=<GOOGLE_MAPS_API_KEY>
```

### C. Konfigurasi PM2 (`ecosystem.config.js`)
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
    server_name qpass.my.id www.qpass.my.id <IP_SERVER_VPS> _;

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

## 4. Langkah-Langkah Deployment

### Langkah 1: Persiapan Database PostgreSQL
```bash
# Masuk ke sesi psql sebagai user postgres
sudo -u postgres psql

# Buat database & user
CREATE DATABASE qpass_bitung;
CREATE USER <DB_USER> WITH PASSWORD '<DB_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE qpass_bitung TO <DB_USER>;
\q
```

### Langkah 2: Setup & Jalankan Backend
```bash
cd /root/home/qpass/backend

# Install dependensi
npm install --omit=dev

# Generate Prisma Client & sinkronisasi skema
npx prisma generate
npx prisma db push

# (Opsional) Jalankan data seeder awal akun pengguna
node prisma/seed.js

# Jalankan Backend melalui PM2 Process Manager
cd /root/home/qpass
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Langkah 3: Build & Publikasikan Frontend
```bash
cd /root/home/qpass/frontend

# Install dependensi & kompilasi bundle produksi
npm install
npm run build

# Salin aset build ke folder publik web server
mkdir -p /var/www/qpass
cp -rf dist/* /var/www/qpass/
chown -R www-data:www-data /var/www/qpass
chmod -R 755 /var/www/qpass
```

### Langkah 4: Setup & Reload Nginx
```bash
# Pasang file konfigurasi Nginx
sudo cp /root/home/qpass/deployment/qpass.my.id.conf /etc/nginx/sites-available/qpass.my.id
sudo ln -sf /etc/nginx/sites-available/qpass.my.id /etc/nginx/sites-enabled/default

# Verifikasi sintaks dan reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Monitoring & Troubleshooting

### A. Perintah Pemeliharaan
* **Status PM2**: `pm2 status`
* **Log Real-time Backend**: `pm2 logs qpass-backend --lines 50`
* **Status Service Nginx**: `systemctl status nginx`
* **Status Database**: `systemctl status postgresql`

### B. Health Check Endpoint
```bash
# Verifikasi backend internal
curl -i http://127.0.0.1:5000/api/health

# Verifikasi via Nginx reverse proxy
curl -i http://127.0.0.1/api/health
```

### C. Troubleshooting Umum
1. **Port Terkunci (EADDRINUSE: 5000)**:
   Periksa proses yang sedang berjalan: `npx kill-port 5000` atau restart PM2: `pm2 restart qpass-backend`.
2. **Error 500 Internal Server Error pada Frontend**:
   Pastikan folder `/var/www/qpass` memiliki permission `755` dan dimiliki oleh user web server `www-data:www-data`.
3. **Database Authentication Failed (Prisma P1000)**:
   Pastikan string koneksi `DATABASE_URL` di file `.env` sudah sesuai dengan user dan password PostgreSQL di VPS.
