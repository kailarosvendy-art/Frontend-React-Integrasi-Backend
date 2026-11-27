# Frontend Rasa Kantin

Frontend React + TypeScript ini memakai Fetch API untuk mengintegrasikan API Express hingga Tugas 5.

Panduan SQL, penggunaan akun lama, pengujian otomatis, dan susunan laporan ada di [README utama](../README.md).

## Menjalankan aplikasi

1. Pastikan backend `tugas_3_validasi_error_auth` berjalan di `http://localhost:3000`, SQL Server aktif, dan `JWT_SECRET` sudah dikonfigurasi dalam `.env` backend.
2. Dari folder `frontend`, salin `.env.example` menjadi `.env` bila diperlukan. Untuk pengembangan lokal, biarkan `VITE_API_BASE_URL=/api/v1` dan sesuaikan `VITE_BACKEND_URL` bila backend berjalan di alamat lain. Proxy Vite meneruskan request API agar browser tidak memblokirnya karena CORS.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`, kemudian buka alamat yang ditampilkan Vite.
5. Untuk memeriksa TypeScript dan membuat build produksi, jalankan `npm run build`.

Untuk produksi di luar proxy Vite, atur `VITE_API_BASE_URL` ke alamat API penuh dan pastikan backend mengizinkan CORS dari origin frontend.

## Integrasi dan hak akses

- Token login disimpan di `localStorage`, dikirim sebagai `Authorization: Bearer <token>`, dan sesi dipulihkan melalui `GET /auth/me`.
- Registrasi dan login memakai `POST /auth/register` dan `POST /auth/login`, lalu sesi dipulihkan melalui `GET /auth/me`. Registrasi selalu membuat role `customer`; role `owner` dan `admin` hanya dapat diberikan melalui backend/seed.
- JWT berlaku 2 jam. Logout mengirim `POST /auth/logout` untuk mencatat aktivitas secara best-effort, lalu menghapus token dari browser.
- Admin melihat halaman Audit log untuk memfilter aksi, tabel target, target ID, user ID, dan rentang tanggal; pagination serta dialog detail mengambil data dari API backend.
- `GET /audit-logs` dan `GET /audit-logs/:id` tersedia khusus admin; metadata detail menampilkan IP address dan user agent. Audit tidak dapat dibuat atau diubah lewat UI.
- Daftar warung menggunakan `GET /stalls` dengan `search`, `category`, `page`, dan `limit`. Detail memakai `GET /stalls/:id`.
- Admin dapat membuat, mengubah, dan menghapus warung. Owner dapat membuat warung dan hanya melihat kontrol ubah untuk warung miliknya. Backend tetap menjadi penentu izin terakhir (401/403 ditampilkan sebagai error).
- Customer yang login dapat melihat ulasan dari `GET /reviews` dan mengirim review ke `POST /reviews`. Identitas penulis diambil backend dari JWT, bukan dari body request.
- Filter daftar, form, loading, empty, error, dan pagination mengikuti respons backend. Perubahan data dikirim ke backend; aplikasi tidak menganggap perubahan lokal sebagai penyimpanan berhasil.

## Struktur utama

- `src/services/api.ts`: base URL, Fetch API, token JWT, dan normalisasi error.
- `src/services/authService.ts` dan `src/context/AuthContext.tsx`: endpoint autentikasi dan state user/role.
- `src/services/auditService.ts` dan `src/pages/AuditLogs.tsx`: daftar audit admin, filter, pagination, dan detail.
- `src/services/stallService.ts`: daftar, detail, CRUD warung, serta review.
- `src/components/` dan `src/pages/`: komponen form, kartu, feedback, autentikasi, dan detail.

## Skenario uji manual

Jalankan backend dan database, lalu login sebagai admin dan buka **Audit log** di menu atas. Lakukan logout, login lagi, lalu pastikan muncul catatan `LOGOUT` dan `LOGIN`; coba filter menurut target ID dan user ID, navigasi antarhalaman, dan buka detail untuk memeriksa metadata, IP address, serta user agent. Cocokkan hasilnya dengan `GET /api/audit-logs` dan `GET /api/audit-logs/:id`; untuk membuktikan data tersimpan, periksa tabel `AUDIT_LOGS` di SQL Server. Pastikan owner/customer menerima 403, permintaan tanpa token menerima 401, ID yang tidak ada menerima 404, dan trigger menolak UPDATE/DELETE. Skenario katalog lain tetap dapat diuji dengan panduan yang sama seperti sebelumnya.
