# Study Dashboard - Chrome Extension Distribution

Repository ini adalah repository distribusi untuk file rilis Chrome Extension **Study Dashboard**. Isi utamanya adalah paket `.zip` siap pakai yang dapat di-extract lalu dimuat ke Chrome melalui mode developer.

## Informasi Rilis

- Nama produk: `Study Dashboard`
- Tipe: `Chrome Extension`
- Versi terbaru: `1.4`
- Manifest: `v3`
- File distribusi terbaru: `StudyFlow-v1.4.zip`
- Repository distribusi: `https://github.com/whyith699-netizen/StudyFlow`

## Gambaran Singkat

Study Dashboard adalah extension produktivitas belajar yang menggabungkan pengelolaan tugas, jadwal kelas, deadline, timer belajar, dan sinkronisasi data cloud dalam satu dashboard popup di browser. Extension ini ditujukan untuk membantu pengguna mengatur kegiatan akademik secara lebih rapi tanpa harus membuka aplikasi terpisah.

Versi distribusi di repository ini sudah melalui proses build production dari source project, termasuk minify untuk output bundle dan obfuscation pada berkas JavaScript hasil build.

## Isi Repository

Repository ini dipakai untuk distribusi release, sehingga isinya sengaja sederhana:

- `StudyFlow-v1.4.zip`
  Paket extension terbaru yang siap diunduh dan di-load ke Chrome.
- `README.md`
  Dokumentasi penggunaan, instalasi, pembaruan, dan informasi rilis.

Versi lama `StudyFlow-v1.3.zip` sudah dihapus agar repository hanya menyimpan artefak terbaru.

## Fitur Utama

### Manajemen Tugas

- Membuat, mengedit, dan menghapus task.
- Menandai task sebagai penting.
- Menandai task sebagai selesai.
- Mengatur deadline lengkap dengan waktu.
- Mengelompokkan task berdasarkan kelas.
- Melihat status tugas yang akan datang dan yang sudah selesai.

### Organisasi Kelas

- Membuat banyak kelas atau mata pelajaran.
- Menambahkan ikon atau identitas kelas.
- Menyimpan tautan pendukung seperti Zoom, Drive, atau referensi lain.
- Menentukan jadwal kelas berdasarkan hari.
- Melihat tugas yang terhubung dengan kelas tertentu.

### Sinkronisasi Cloud

- Sinkronisasi data menggunakan Firebase.
- Mendukung login Google.
- Mendukung login email dan password.
- Menyimpan data pengguna secara terpisah per akun.

### Dashboard Produktivitas

- Popup extension yang cepat dibuka dari toolbar Chrome.
- Tampilan responsif untuk area popup extension.
- Pencarian dan filtering data.
- Dukungan notifikasi deadline.
- Mendukung fitur timer dan pelacakan aktivitas belajar.

## Cara Install di Chrome

Karena extension ini didistribusikan dalam bentuk zip untuk mode developer, instalasinya menggunakan metode `Load unpacked`.

### Langkah Instalasi

1. Download file `StudyFlow-v1.4.zip` dari repository ini.
2. Extract file zip ke folder lokal.
3. Buka Chrome lalu masuk ke `chrome://extensions/`.
4. Aktifkan `Developer mode` di kanan atas.
5. Klik tombol `Load unpacked`.
6. Pilih folder hasil extract.
7. Extension `Study Dashboard` akan muncul di daftar extension dan siap digunakan.

### Setelah Berhasil Terpasang

1. Klik ikon extension pada toolbar Chrome.
2. Login menggunakan Google atau email/password.
3. Tambahkan kelas.
4. Tambahkan task dan deadline.
5. Gunakan dashboard popup untuk memantau aktivitas belajar.

## Cara Update ke Versi Baru

Extension yang dipasang lewat `Load unpacked` tidak update otomatis seperti extension dari Chrome Web Store. Untuk itu pembaruan dilakukan manual.

### Langkah Update

1. Download file rilis terbaru dari repository ini.
2. Extract ke folder baru atau timpa folder extension lama.
3. Buka `chrome://extensions/`.
4. Cari `Study Dashboard`.
5. Klik tombol `Reload`.
6. Extension akan berjalan dengan versi terbaru.

## Konten di Dalam Paket Zip

File `StudyFlow-v1.4.zip` berisi hasil build production dari folder `dist/` extension. Struktur utamanya mencakup:

- `manifest.json`
- `index.html`
- `service-worker-loader.js`
- folder `assets/`
- folder `public/assets/icons/`
- folder `.vite/`

Dengan kata lain, file zip ini bukan source mentah, tetapi output build yang memang ditujukan untuk distribusi dan penggunaan langsung di browser.

## Detail Teknis Rilis

Rilis `v1.4` dibangun dari source extension dengan pendekatan berikut:

- Build tool: `Vite`
- Framework UI: `React`
- Chrome extension plugin: `@crxjs/vite-plugin`
- Minify: `terser`
- Obfuscation: `rollup-plugin-obfuscator`
- Manifest Chrome Extension: `Manifest V3`

Build production menghapus `console` dan `debugger` dari bundle output untuk hasil rilis yang lebih bersih.

## Permission Extension

Extension ini menggunakan sejumlah permission yang diperlukan untuk fitur inti. Pada rilis `1.4`, permission utamanya mencakup:

- `storage`
- `activeTab`
- `tabs`
- `webNavigation`
- `notifications`
- `alarms`
- `identity`
- `declarativeNetRequest`

Host permission yang dipakai:

- `https://*.googleapis.com/*`
- `https://*.firebaseio.com/*`
- `https://*.gstatic.com/*`

Permission tersebut digunakan untuk penyimpanan lokal, autentikasi, sinkronisasi cloud, alarm/notifikasi, serta integrasi yang diperlukan untuk fitur extension.

## Keamanan dan Privasi

Beberapa catatan penting terkait keamanan:

- Extension menggunakan autentikasi pengguna sehingga data tidak terbuka ke semua orang.
- Sinkronisasi data bergantung pada Firebase.
- API client-side tetap harus dilindungi oleh aturan backend seperti Firestore Security Rules.
- Repository distribusi ini tidak dimaksudkan untuk menyimpan rahasia server.
- Paket zip di repo ini adalah artefak build yang siap digunakan pengguna akhir.

## Troubleshooting

Jika extension tidak muncul atau gagal dijalankan setelah di-load:

1. Pastikan folder yang dipilih adalah hasil extract zip, bukan file zip langsung.
2. Pastikan `Developer mode` sudah aktif.
3. Klik `Reload` pada extension setelah mengganti file.
4. Periksa apakah Chrome menampilkan error pada halaman `chrome://extensions/`.
5. Jika perlu, hapus extension lalu lakukan `Load unpacked` ulang dari folder hasil extract yang bersih.

Jika login atau sinkronisasi bermasalah:

1. Pastikan koneksi internet aktif.
2. Pastikan layanan Firebase dan autentikasi pada source project memang terkonfigurasi benar.
3. Reload extension lalu login ulang.

## Catatan Untuk Developer

Repository ini adalah repository distribusi, bukan source repository utama. Source extension utama berada pada workspace project internal di folder `Extension/`, kemudian dibuild menjadi output `dist/`, dikemas ke `StudyFlow-v1.4.zip`, lalu dipush ke repository ini sebagai artefak rilis terbaru.

Alur rilis yang dipakai untuk versi ini:

1. Build production dari source extension.
2. Pastikan versi manifest adalah `1.4`.
3. Kemas folder `dist/` menjadi `StudyFlow-v1.4.zip`.
4. Hapus zip versi lama dari repository distribusi.
5. Tambahkan atau perbarui `README.md`.
6. Commit dan push ke `origin/main`.

## Riwayat Versi Distribusi

- `v1.4`
  Rilis terbaru yang tersedia saat ini di repository distribusi.
- `v1.3`
  Versi sebelumnya, sudah digantikan dan dihapus dari repository agar distribusi tetap fokus pada artefak terbaru.

## Lisensi dan Penggunaan

Jika repository source utama memiliki lisensi terpisah, maka penggunaan extension tetap mengikuti lisensi pada source project tersebut. Repository ini berfungsi terutama sebagai saluran distribusi artefak build.

## Dukungan

Jika ada masalah pada file distribusi:

- periksa kembali langkah install,
- gunakan versi zip terbaru,
- dan cek error pada halaman `chrome://extensions/`.

Untuk pengembangan lebih lanjut, perubahan sebaiknya dilakukan di source extension, lalu dibuild ulang dan didistribusikan kembali ke repository ini.
