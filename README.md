# Tugas 5 - Audit Log Sistem Review Kantin

Aplikasi memakai database **review_kantin** dan akun yang sudah tersedia: Admin Kantin, owner warung, serta customer. Password, role, dan data akun lama tetap digunakan.

## Database yang digunakan

Konfigurasi backend di tugas_3_validasi_error_auth/.env harus menunjuk database yang sudah ada:

```dotenv
DB_NAME=review_kantin
```

Untuk penyesuaian audit T5, jalankan dari folder utama dengan akun administrator SQL Server:

```powershell
$scripts = @(
  'db/03-audit-schema.sql',
  'db/04-audit-append-only.sql',
  'db/05-permissions.sql'
)
foreach ($script in $scripts) {
  sqlcmd -S localhost -E -C -d review_kantin -b -i $script
  if ($LASTEXITCODE -ne 0) { throw "SQL gagal: $script" }
}
```

03-audit-schema.sql menyiapkan default waktu UTC dan index. Trigger mencegah UPDATE/DELETE audit. 05-permissions.sql memakai user koneksi SQL Server praktikum_user yang sudah digunakan aplikasi; hasil izin audit harus SELECT=1, INSERT=1, UPDATE=0, DELETE=0.

01-schema.sql disertakan sebagai definisi tabel untuk pengumpulan. Untuk database yang sudah lengkap, cukup jalankan penyesuaian audit di atas. Tidak ada skrip pembuatan database atau seed akun tambahan.

Gunakan akun yang sudah ada, misalnya Admin Kantin (admin@kantin.test), Bu Tini (tini@kantin.test), dan Bagas (bagas@student.test), dengan password masing-masing yang sudah digunakan sebelumnya.

## Menjalankan aplikasi

Backend, terminal pertama:

```powershell
cd tugas_3_validasi_error_auth
# Gunakan .env yang sudah ada; .env.example untuk referensi konfigurasi.
npm.cmd run dev
```

Backend berjalan di http://localhost:3000, health di /health, dan Swagger di /docs. Isi Authorize di Swagger dengan Bearer diikuti token login. Pertahankan DB_PASSWORD dan JWT_SECRET yang sudah dikonfigurasi.

Frontend, terminal kedua dari folder utama:

```powershell
cd frontend
npm.cmd run dev
```

Buka alamat Vite, biasanya http://localhost:5173. Proxy /api meneruskan request ke backend. Jika alamat backend berbeda, sesuaikan VITE_BACKEND_URL. .env.example berisi placeholder konfigurasi untuk pengumpulan.

## Fitur dan transaksi audit

| Endpoint | Akses / perilaku |
| --- | --- |
| POST /api/v1/auth/login | LOGIN + role, ip_address, user_agent, result; audit best-effort |
| POST /api/v1/auth/logout | User login; LOGOUT best-effort |
| GET /api/audit-logs | Admin; filter dan pagination database |
| GET /api/audit-logs/:id | Admin; detail JOIN USERS; 404 jika tidak ada |
| POST /api/v1/stalls | Owner/admin; CREATE_STALL dalam transaksi |
| PUT /api/v1/stalls/:id | Owner warung tersebut atau admin; UPDATE_STALL dalam transaksi |
| DELETE /api/v1/stalls/:id | Admin; DELETE_STALL dalam transaksi |
| POST /api/v1/reviews | User login; CREATE_REVIEW dalam transaksi |
| DELETE /api/v1/reviews/:id | Admin; DELETE_REVIEW dalam transaksi |
| GET /api/v1/menu-items | Publik |
| POST/PUT/DELETE /api/v1/menu-items[/:id] | Admin atau owner warung; audit CREATE_MENU/UPDATE_MENU/DELETE_MENU |
| POST /api/v1/orders | Customer; CREATE_ORDER; harga dihitung backend |
| GET /api/v1/orders[/:id] | Admin atau customer pemilik pesanan |
| PATCH /api/v1/orders/:id/status | Admin; completed/cancelled; UPDATE_ORDER_STATUS |

Alias audit /api/v1/audit-logs dan /api/v1/audit tetap tersedia. Query audit: page, pageSize, action, targetTable, targetId, userId, from, to. Semua filter digabung AND; tanggal inklusif dalam UTC; urutan created_at DESC lalu id DESC; parameter asing ditolak. Error validasi memakai errors berisi field dan message.

Alur autentikasi: request -> autentikasi -> identitas backend dan IP/user-agent request -> AuditService -> AuditRepository -> INSERT AUDIT_LOGS. Kegagalan audit tidak menggagalkan login/logout.

Alur mutasi: autentikasi/otorisasi dan Zod -> mulai transaksi -> perubahan warung/menu/review/pesanan -> INSERT audit pada transaksi yang sama -> commit. Kegagalan menyebabkan rollback. Metadata order tidak menyimpan nama penerima, telepon, catatan, password, token, atau cookie; metadata review hanya mencatat nama field, bukan teks komentar.

Frontend admin menyediakan filter, pagination, dan modal detail GET /:id. Audit STALLS dan REVIEWS ditambahkan sebagai bonus; masing-masing mencatat aksi create/update/delete yang tersedia pada API.

## Pengujian pada database yang sudah ada

Dari folder backend:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run verify:t5
```

verify:t5 membaca review_kantin, memilih akun admin/owner/customer yang sudah ada, dan membuat token sementara di memori menggunakan mekanisme backend. Pemeriksaan ini menguji endpoint terlindungi, bukan menggantikan pengujian login memakai password asli.

Pemeriksaan database bersifat baca saja. Runner tidak membuat database, akun, warung, menu, pesanan, atau catatan audit. Kasus logout saat audit gagal memakai simulasi writer yang gagal di memori; izin database tetap sama. Mutasi menu/order dan rollback diuji manual saat memang diperlukan untuk aktivitas tugas.

Audit bonus STALLS/REVIEWS juga dibuktikan dengan mutasi sukses pada data uji: POST/PUT warung oleh owner, POST review oleh user login, serta DELETE oleh admin. Setelah tiap respons sukses, ambil catatan melalui GET `/api/audit-logs` dengan filter `targetTable`, `targetId`, dan `action`, lalu cocokkan ID audit dengan SELECT pada `dbo.AUDIT_LOGS`. `verify:t5` tetap read-only dan tidak membuat bukti mutasi ini.

Hasil terkini: output/t5-evidence/api-results.json dan database-proof.json. Perhatikan nama database dan jenis pemeriksaan pada hasil tersebut. Artefak lama sebelum koreksi disimpan terpisah di output/t5-evidence-previous dan tidak digunakan sebagai bukti database saat ini.

Frontend:

```powershell
cd frontend
npm.cmd run build
```

Untuk memeriksa UI, login dengan akun admin yang sudah ada, lalu buka Audit log. Skrip opsional scripts/verify-ui-t5.js dapat dijalankan melalui Playwright CLI pada tab yang sudah login. Skrip tidak mengisi kredensial atau membuat akun. Pagination hanya berpindah halaman jika jumlah data yang tersedia mencukupi.