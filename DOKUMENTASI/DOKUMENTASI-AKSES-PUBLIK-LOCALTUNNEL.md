# PANDUAN AKSES PUBLIK MENGGUNAKAN LOCALTUNNEL

---

## 1. PENDAHULUAN

Dokumen ini berisi panduan khusus untuk mempublikasikan aplikasi **Q-Pass Bitung** ke jaringan publik internet menggunakan **Localtunnel** (`npx localtunnel`). 

Localtunnel adalah alternatif gratis dan cepat tanpa perlu mendaftar akun atau menginstall software tambahan.

---

## 2. PENGATURAN VITE (`vite.config.js`)

Vite versi terbaru secara ketat memverifikasi Host header HTTP. Agar Localtunnel (seperti `*.loca.lt`) dapat terhubung ke server Vite tanpa diblokir oleh error `Blocked request. This host is not allowed`, pastikan opsi `allowedHosts: true` terpasang di `frontend/vite.config.js`:

```javascript
export default defineConfig({
  // ...
  server: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: true, // <-- Membolehkan host tunnel external
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

---

## 3. LANGKAH-LANGKAH MENJALANKAN

### Langkah 1: Pastikan Aplikasi Lokal Aktif
Jalankan aplikasi seperti biasa dari root folder project:
```bash
npm run dev
```

### Langkah 2: Jalankan Localtunnel di Terminal Baru
```bash
npx localtunnel --port 3001 --subdomain qpass-bitung
```

**Output Terminal:**
```text
your url is: https://qpass-bitung.loca.lt
```

---

## 4. MELEWATI HALAMAN VERIFIKASI IP LOCALTUNNEL

Saat pertama kali membuka link `.loca.lt` di browser, Anda akan melihat halaman perlindungan bernama **"Tunnel Password"**.

**Cara Melewatinya:**
1. Dapatkan IP Publik Anda dengan membuka URL berikut di browser / terminal:
   - Buka: `https://loca.lt/mytunnelpassword` ATAU
   - Ketik di terminal: `curl https://loca.lt/mytunnelpassword`
2. Salin deretan angka IP yang muncul (misalnya: `180.252.21.45`).
3. Tempelkan angka IP tersebut pada kolom **Tunnel Password** di halaman `.loca.lt`, lalu klik tombol **Submit**.
4. Halaman aplikasi **Q-Pass Bitung** akan langsung terbuka normal.
