# Frontend Rasa Kantin

Frontend React + TypeScript ini memakai Fetch API untuk mengintegrasikan API Express pada Tugas 2–3.

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
- JWT berlaku 2 jam. Logout menghapus token dari browser karena backend tidak menyediakan endpoint logout.
- Daftar warung menggunakan `GET /stalls` dengan `search`, `category`, `page`, dan `limit`. Detail memakai `GET /stalls/:id`.
- Admin dapat membuat, mengubah, dan menghapus warung. Owner dapat membuat warung dan hanya melihat kontrol ubah untuk warung miliknya. Backend tetap menjadi penentu izin terakhir (401/403 ditampilkan sebagai error).
- Customer yang login dapat melihat ulasan dari `GET /reviews` dan mengirim review ke `POST /reviews`. Identitas penulis diambil backend dari JWT, bukan dari body request.
- Filter daftar, form, loading, empty, error, dan pagination mengikuti respons backend. Perubahan data dikirim ke backend; aplikasi tidak menganggap perubahan lokal sebagai penyimpanan berhasil.

## Struktur utama

- `src/services/api.ts`: base URL, Fetch API, token JWT, dan normalisasi error.
- `src/services/authService.ts` dan `src/context/AuthContext.tsx`: endpoint autentikasi dan state user/role.
- `src/services/stallService.ts`: daftar, detail, CRUD warung, serta review.
- `src/components/` dan `src/pages/`: komponen form, kartu, feedback, autentikasi, dan detail.

## Skenario uji manual

Jalankan backend dan database, lalu verifikasi daftar/detail warung; pencarian, kategori, dan pagination; registrasi/login serta pemulihan sesi; CRUD admin; pembuatan warung dan perubahan warung sendiri oleh owner; penolakan perubahan warung milik owner lain; akses hapus oleh admin saja; pengiriman review; serta kondisi loading, daftar kosong, 401, 403, dan server tidak tersedia. Periksa respons endpoint/database backend untuk memastikan perubahan benar-benar tersimpan.
