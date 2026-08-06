# BAB I
# PENDAHULUAN

## 1.1 Latar Belakang

Pertamina sebagai Badan Usaha Milik Negara (BUMN) yang bergerak di bidang energi, khususnya dalam distribusi Bahan Bakar Minyak (BBM), memiliki tanggung jawab besar untuk memastikan kualitas dan kuantitas BBM yang didistribusikan ke seluruh Indonesia mencapai standar yang telah ditetapkan. Terminal Bitung sebagai salah satu fasilitas penting dalam rantai distribusi BBM di wilayah Sulawesi Utara, berperan sebagai titik pengiriman BBM ke berbagai Stasiun Pengisian Bahan Bakar Umum (SPBU) di area tersebut.

Dalam proses distribusi BBM dari terminal ke SPBU, terdapat beberapa tantangan yang perlu diantisipasi. Pertama, proses loading order atau pemesanan BBM masih dilakukan secara manual dengan keterbatasan dalam tracking real-time. Kedua, sistem feedback dari SPBU mengenai kualitas dan kuantitas BBM yang diterima belum terstruktur dengan baik, sehingga sulit untuk dilakukan analisis dan evaluasi secara sistematis. Ketiga, mekanisme pelaporan keluhan atau masalah yang terjadi selama proses pengiriman belum optimal, menyebabkan respon terhadap permasalahan menjadi lambat.

Berdasarkan data yang diperoleh dari Pertamina Terminal Bitung, setiap harinya terdapat rata-rata 5-10 loading order yang diproses untuk distribusi ke berbagai SPBU. Setiap loading order melibatkan proses quality assurance yang mencakup pengecekan kondisi segel, volume BBM, kondisi visual, dan densitas. Namun, sistem pencatatan dan monitoring masih dilakukan secara manual menggunakan spreadsheet dan formulir kertas, yang memiliki beberapa kelemahan seperti rentan terhadap kesalahan manusia, sulit untuk dilacak, dan tidak memberikan notifikasi real-time.

Perkembangan teknologi informasi saat ini memberikan peluang besar untuk meningkatkan efisiensi dan efektivitas dalam proses distribusi BBM. Teknologi web modern berbasis React.js dan Node.js memungkinkan pembuatan aplikasi yang interaktif, responsif, dan mampu memberikan pengalaman pengguna yang baik. Sistem database relasional seperti PostgreSQL menyediakan keandalan dalam penyimpanan dan pengelolaan data. Teknologi QR code memungkinkan tracking yang akurat dan efisien untuk setiap loading order. Sistem notifikasi real-time menggunakan Socket.IO memungkinkan monitoring yang up-to-date.

Melihat kondisi tersebut, diperlukan sebuah sistem informasi yang terintegrasi untuk memonitoring proses distribusi BBM dari terminal ke SPBU. Sistem ini harus mampu mengelola loading order, memberikan mekanisme feedback yang terstruktur, mendeteksi keluhan secara otomatis, dan menyediakan notifikasi real-time untuk semua pihak terkait termasuk admin, pengawas, SPBU, dan Awak Mobil Tangki (AMT).

Sistem Quality & Quantity Assurance Testimonial (Q-Pass) diusulkan sebagai solusi untuk mengatasi permasalahan tersebut. Sistem ini dirancang untuk memberikan transparansi dalam proses distribusi BBM, meningkatkan kualitas pelayanan, dan memudahkan dalam pengambilan keputusan berdasarkan data yang terkumpul secara sistematis. Dengan adanya sistem ini, diharapkan proses distribusi BBM di Terminal Bitung dapat berjalan lebih efisien, transparan, dan terukur.

## 1.2 Rumusan Masalah

Berdasarkan latar belakang yang telah diuraikan, maka rumusan masalah dalam penelitian ini adalah sebagai berikut:

1. Bagaimana merancang sistem untuk monitoring pengiriman BBM dari terminal ke SPBU dengan menggunakan QR code untuk tracking loading order?

2. Bagaimana mengimplementasikan sistem feedback yang terstruktur untuk menilai kualitas dan kuantitas BBM yang diterima SPBU?

3. Bagaimana membangun sistem keluhan otomatis yang dapat mendeteksi anomali berdasarkan feedback yang diberikan?

4. Bagaimana mengimplementasikan sistem notifikasi real-time untuk monitoring loading order dan feedback?

5. Bagaimana merancang sistem keamanan yang memadai dengan multi-role access control untuk berbagai pengguna (Admin, Pengawas, SPBU, AMT)?

6. Bagaimana mengimplementasikan sistem backup database otomatis untuk menjaga keamanan dan ketersediaan data?

## 1.3 Tujuan Penelitian

Tujuan umum dari penelitian ini adalah mengembangkan Sistem Quality & Quantity Assurance Testimonial (Q-Pass) berbasis web untuk monitoring pengiriman BBM pada Terminal Bitung yang terintegrasi dengan sistem feedback, keluhan, dan notifikasi real-time.

Sedangkan tujuan khusus dari penelitian ini adalah:

1. Merancang dan membangun sistem monitoring loading order dengan integrasi QR code untuk tracking yang akurat.

2. Mengimplementasikan sistem feedback multi-aspek yang mencakup penilaian kualitas (kondisi segel, densitas, visual) dan kuantitas (volume BBM).

3. Membangun sistem keluhan otomatis yang dapat mendeteksi anomali berdasarkan parameter feedback yang diberikan.

4. Mengimplementasikan sistem notifikasi real-time menggunakan teknologi Socket.IO untuk monitoring loading order dan feedback secara langsung.

5. Membangun sistem keamanan yang memadai dengan implementasi authentication menggunakan JWT, authorization dengan role-based access control, dan enkripsi password.

6. Mengimplementasikan sistem backup database otomatis menggunakan PostgreSQL untuk menjaga keamanan dan ketersediaan data.

7. Menguji performa dan keamanan sistem untuk memastikan sistem berjalan sesuai dengan kebutuhan.

## 1.4 Manfaat Penelitian

### 1.4.1 Manfaat Teoretis

1. Memberikan kontribusi terhadap pengembangan ilmu pengetahuan di bidang sistem informasi, khususnya dalam penerapan teknologi web modern untuk sistem monitoring dan quality assurance.

2. Menjadi referensi bagi peneliti lain yang ingin mengembangkan sistem serupa di bidang distribusi energi atau industri lain yang membutuhkan sistem quality assurance.

3. Menambah literatur tentang penerapan teknologi QR code, real-time communication, dan multi-role access control dalam sistem informasi berbasis web.

### 1.4.2 Manfaat Praktis

1. **Bagi Pertamina Terminal Bitung**
   - Meningkatkan efisiensi dalam proses monitoring distribusi BBM
   - Mempermudah tracking loading order dengan sistem QR code
   - Mendapatkan data feedback yang terstruktur untuk analisis kualitas
   - Mempercepat respon terhadap keluhan yang muncul

2. **Bagi SPBU**
   - Mempermudah proses feedback terhadap BBM yang diterima
   - Mendapatkan sistem keluhan yang transparan dan responsif
   - Memiliki riwayat penerimaan BBM yang terdokumentasi dengan baik

3. **Bagi Awak Mobil Tangki (AMT)**
   - Memiliki sistem untuk memberikan penilaian terhadap SPBU
   - Mendapatkan riwayat performa SPBU berdasarkan penilaian
   - Mempermudah pelaporan masalah yang terjadi selama proses bongkar muat

4. **Bagi Pengawas**
   - Memiliki sistem monitoring real-time terhadap seluruh proses distribusi
   - Mempermudah analisis data untuk pengambilan keputusan
   - Memiliki dashboard yang komprehensif untuk monitoring

5. **Bagi Peneliti**
   - Mendapatkan pengalaman praktis dalam pengembangan sistem informasi berbasis web modern
   - Meningkatkan kemampuan dalam penerapan berbagai teknologi terkini

## 1.5 Batasan Masalah

Agar penelitian ini terfokus dan dapat diselesaikan dengan baik, maka perlu ditetapkan batasan-batasan masalah sebagai berikut:

1. Sistem yang dikembangkan berfokus pada monitoring pengiriman BBM dari Terminal Bitung ke SPBU di area Sulawesi Utara.

2. Sistem tidak mencakup proses produksi BBM di kilang, hanya mulai dari loading order di terminal hingga penerimaan di SPBU.

3. Sistem tidak mengintegrasikan langsung dengan sistem SAP atau ERP Pertamina pusat, namun dirancang untuk dapat diintegrasikan di masa depan.

4. Sistem tidak mencakup sistem pembayaran transaksional, hanya fokus pada quality assurance dan monitoring.

5. Sistem dikembangkan untuk penggunaan internal Pertamina dengan asumsi user yang terdaftar dan terverifikasi.

6. Pengujian sistem dilakukan dengan data simulasi dan data real dari Terminal Bitung dalam skala terbatas.

7. Sistem tidak mencakup fitur mobile native application, hanya web application yang responsif untuk mobile.

8. Keamanan sistem diimplementasikan pada level aplikasi (authentication, authorization, encryption), namun tidak mencakup security infrastructure tingkat lanjut seperti firewall enterprise atau DDoS protection.

## 1.6 Sistematika Penulisan

Skripsi ini disusun dengan sistematika penulisan sebagai berikut:

**BAB I PENDAHULUAN**
Berisi latar belakang masalah, rumusan masalah, tujuan penelitian, manfaat penelitian, batasan masalah, dan sistematika penulisan.

**BAB II TINJAUAN PUSTAKA**
Berisi landasan teori yang mendukung penelitian meliputi sistem informasi, quality assurance, web application development, database management, keamanan sistem, dan teknologi modern yang digunakan. Selain itu juga berisi penelitian terdahulu yang relevan dan kerangka pemikiran peneliti.

**BAB III METODOLOGI PENELITIAN**
Berisi metode penelitian yang digunakan, model pengembangan sistem, tahapan pengembangan, alat dan bahan yang digunakan, teknik pengumpulan data, dan teknik analisis data.

**BAB IV HASIL DAN PEMBAHASAN**
Berisi hasil analisis kebutuhan sistem, perancangan sistem meliputi arsitektur sistem, perancangan database, perancangan UI/UX, dan perancangan API. Selanjutnya berisi implementasi sistem yang meliputi implementasi backend, implementasi frontend, dan integrasi fitur. Terakhir berisi pengujian sistem yang meliputi pengujian fungsional, pengujian performa, dan pengujian keamanan, beserta pembahasannya.

**BAB V KESIMPULAN DAN SARAN**
Berisi kesimpulan dari seluruh hasil penelitian, saran untuk pengembangan lebih lanjut, dan limitasi penelitian yang telah dilakukan.
