# PANDUAN AKSES PUBLIK LOKAL MENGGUNAKAN CLOUDFLARE TUNNEL

---

## 1. PENDAHULUAN

Dokumen ini berisi panduan langkah demi langkah untuk menguji dan mempublikasikan aplikasi atau API lokal **Q-Pass Bitung** (yang berjalan di `http://127.0.0.1:5002` / `http://localhost:5002`) agar dapat diakses secara publik melalui internet menggunakan **Cloudflare Tunnel (Quick Tunnel)**.

Dengan Cloudflare Tunnel, Anda tidak perlu melakukan *Port Forwarding* pada router atau menyewa IP Publik. Cloudflare secara otomatis menyediakan link HTTPS aman (contoh: `https://combined-had-powell-human.trycloudflare.com`) yang dapat diakses oleh siapa saja dari mana saja.

---

## 2. PRASYARAT (PREREQUISITES)

Sebelum menjalankan Cloudflare Tunnel, pastikan hal-hal berikut telah terpenuhi:

1. **Node.js & NPX** sudah terinstall pada perangkat / laptop Anda.
2. **Server Backend/Aplikasi Q-Pass Bitung** sudah berjalan di port `5002`.
   - Jalankan backend terlebih dahulu (misal: `npm run dev` atau `node src/server.js` di folder `backend/`).
   - Pastikan aplikasi bisa diakses secara lokal di browser melalui `http://127.0.0.1:5002` atau `http://localhost:5002`.

---

## 3. LANGKAH-LANGKAH MENJALANKAN (STEP-BY-STEP)

### Langkah 1: Buka Terminal / Command Prompt
Buka terminal baru di VS Code, PowerShell, atau Command Prompt (CMD).

### Langkah 2: Jalankan Perintah Cloudflare Tunnel
Ketikkan perintah berikut lalu tekan **Enter**:

```bash
npx cloudflared tunnel --url http://127.0.0.1:5002
```

> **Catatan**: Jika ini pertama kali Anda menjalankan perintah ini, `npx` akan mengunduh paket binary `cloudflared` secara otomatis tanpa perlu instalasi manual tambahan.

### Langkah 3: Dapatkan Link Publik
Setelah perintah dijalankan, perhatikan output pada terminal. Anda akan melihat log yang menampilkan URL publik HTTPS resmi dari Cloudflare:

```text
2026-08-06T11:45:00Z INF +--------------------------------------------------------------------------------------------+
2026-08-06T11:45:00Z INF | Your quick Tunnel has been created! Visit it at (links may be logged publicly, be mindful): |
2026-08-06T11:45:00Z INF | https://combined-had-powell-human.trycloudflare.com                                       |
2026-08-06T11:45:00Z INF +--------------------------------------------------------------------------------------------+
```

### Langkah 4: Uji Coba Akses Publik
1. Salin (copy) link yang berakhiran `.trycloudflare.com` tersebut.
2. Buka browser di perangkat lain (misal: Handphone dengan paket data seluler / jaringan luar).
3. Tempelkan link tersebut (contoh: `https://combined-had-powell-human.trycloudflare.com`).
4. Aplikasi/API backend lokal Anda kini sudah berhasil diakses dari jaringan publik global.

---

## 4. HAL-HAL PENTING YANG PERLU DIPERHATIKAN

| Fitur / Karakteristik | Penjelasan |
|-----------------------|------------|
| **Domain Sementara (Ephemeral)** | Setiap kali Anda menghentikan terminal (`Ctrl + C`) dan menjalankannya ulang, Cloudflare akan memberikan URL baru yang acak. |
| **HTTPS Otomatis** | Link yang dihasilkan sudah menggunakan enkripsi SSL/TLS (HTTPS) bawaan Cloudflare. |
| **Proses Harus Tetap Berjalan** | Jendela terminal yang menjalankan `npx cloudflared` harus **tetap terbuka/aktif**. Jika terminal ditutup, akses publik akan terputus. |
| **Koneksi Frontend-Backend** | Jika menguji Frontend secara publik, pastikan variabel environment (seperti `VITE_API_BASE_URL` di Frontend) diarahkan ke URL Cloudflare Tunnel ini. |

---

## 5. PENANGANAN MASALAH (TROUBLESHOOTING)

1. **Error `502 Bad Gateway` saat membuka URL Cloudflare:**
   - **Penyebab**: Server lokal di port 5002 belum dinyalakan atau sudah mati.
   - **Solusi**: Pastikan backend di port 5002 sudah aktif dan dapat diakses di `http://127.0.0.1:5002` sebelum menjalankan tunnel.

2. **Pesan `{"success":false,"message":"Route GET / not found"}` saat membuka root URL:**
   - **Penyebab**: Port **5002** adalah port **Backend API Express.js**, bukan server Frontend UI (React/Vite). Server Backend secara default tidak menyediakan tampilan/halaman di path utama (`/`).
   - **Solusi A (Mengecek API Backend)**: Tambahkan path endpoint API di akhir URL, misalnya:
     - `https://combined-had-powell-human.trycloudflare.com/api/health`
     - `https://combined-had-powell-human.trycloudflare.com/api/spbu`
   - **Solusi B (Jika Ingin Mengakses Tampilan Frontend / UI)**:
     Arahkan Cloudflare Tunnel ke port **Frontend Vite** (yaitu port **3001** sesuai `vite.config.js`):
     ```bash
     npx cloudflared tunnel --url http://127.0.0.1:3001
     ```
     > *Catatan*: Jika membuka tunnel untuk Frontend (3001), pastikan `VITE_API_URL` di file `frontend/.env` telah disesuaikan agar menunjuk ke URL tunnel backend.

3. **Error CORS (`Cross-Origin Resource Sharing`) di Frontend:**
   - **Penyebab**: Backend menolak request yang berasal dari domain external Cloudflare (`trycloudflare.com`).
   - **Solusi**: Pastikan konfigurasi CORS di backend Express (`cors()`) mengizinkan request dari semua origin `*` atau menambahkan domain `.trycloudflare.com` ke daftar whitelist CORS.

4. **Perintah NPX Gagal / Timeout:**
   - **Penyebab**: Koneksi internet tidak stabil atau diblokir oleh Firewall/Antivirus.
   - **Solusi**: Pastikan koneksi internet aktif dan beri izin pada `cloudflared` jika muncul pop-up Windows Defender Firewall.

---

## 6. RANGKUMAN PERINTH UTAMA

```bash
# 1. Jalankan Backend lokal (Terminal 1)
cd backend
npm run dev

# 2. Jalankan Cloudflare Tunnel (Terminal 2)
npx cloudflared tunnel --url http://127.0.0.1:5002
```
