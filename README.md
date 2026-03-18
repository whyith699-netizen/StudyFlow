# Study Dashboard Extension

Chrome extension untuk manajemen belajar yang mencakup task, jadwal kelas, deadline, timer, dan sinkronisasi cloud.

## Version

- Current release: `1.4`
- Manifest: `v3`

## Fitur Utama

- Kelola task: tambah, ubah, hapus, tandai penting, dan tandai selesai.
- Kelola kelas: buat beberapa kelas, atur ikon, tautan terkait, dan jadwal harian.
- Sinkronisasi cloud dengan Firebase.
- Login menggunakan Google atau email/password.
- Notifikasi deadline dan popup dashboard yang responsif.

## Cara Install

1. Download file `StudyFlow-v1.4.zip` dari repository ini.
2. Extract zip ke folder lokal.
3. Buka `chrome://extensions/`.
4. Aktifkan `Developer mode`.
5. Klik `Load unpacked`.
6. Pilih folder hasil extract.

## Cara Update

1. Download rilis terbaru.
2. Ganti folder extension lama dengan hasil extract baru.
3. Buka `chrome://extensions/`.
4. Klik `Reload` pada extension Study Dashboard.

## Pengembangan

Source extension utama ada di folder `Extension/` pada workspace proyek. Build distribusi dibuat dengan Vite, minify `terser`, dan obfuscation pada output bundle.
