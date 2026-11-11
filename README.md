# Tugas 4 — Sistem Review Kantin

Aplikasi sistem review kantin dengan frontend React + TypeScript dan backend Express + TypeScript. Backend menggunakan Drizzle ORM untuk mengakses SQL Server.

## Struktur proyek

- `frontend/` — antarmuka pengguna untuk melihat warung, autentikasi, dan review.
- `tugas_3_validasi_error_auth/` — API backend, autentikasi, dokumentasi Swagger, serta integrasi database.

## Prasyarat

- Node.js **22.18.0 atau lebih baru** dan npm.
- SQL Server aktif dengan database, tabel, dan data awal yang diperlukan backend.
- Kredensial database dan `JWT_SECRET` untuk konfigurasi backend.

## Menjalankan aplikasi

### 1. Siapkan backend

Buka terminal di folder backend:

```powershell
cd tugas_3_validasi_error_auth
Copy-Item .env.example .env
npm install
```

Ubah nilai konfigurasi database di `.env`, lalu ganti `JWT_SECRET` dengan secret acak yang kuat. Pastikan database dan skemanya sudah disiapkan sebelum menjalankan backend.

Jalankan server:

```powershell
npm run dev
```

Backend berjalan di `http://localhost:3000`. Periksa koneksi server dan database di `http://localhost:3000/health`; dokumentasi API tersedia di `http://localhost:3000/docs`.

### 2. Jalankan frontend

Buka terminal lain di folder frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Buka alamat lokal yang ditampilkan Vite (umumnya `http://localhost:5173`). Proxy Vite meneruskan request `/api` ke backend di `http://localhost:3000`. Jika backend memakai alamat lain, sesuaikan `VITE_BACKEND_URL` di `frontend/.env`.

## Pemeriksaan

Jalankan perintah berikut dari folder masing-masing:

```powershell
# frontend
npm run build

# backend
npm test
```

Panduan lebih lengkap untuk tiap bagian tersedia di [frontend/README.md](./frontend/README.md) dan [tugas_3_validasi_error_auth/README.md](./tugas_3_validasi_error_auth/README.md).
