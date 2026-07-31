# Miori Booth — Virtual Photobooth Wedding

Scaffold lengkap: Next.js (App Router) + Prisma + Upstash Redis + Cloudinary.

## 1. Install

```bash
npm install
```

## 2. Isi Environment Variables

Copy `.env.example` jadi `.env`:

```bash
cp .env.example .env
```

Lalu isi satu-satu:

### Database (dev)
Biarkan default, tidak perlu diubah untuk lokal:
```
DATABASE_URL="file:./dev.db"
```

### Upstash Redis
1. Buat akun di https://upstash.com (gratis)
2. Buat database Redis baru (region terdekat, misal Singapore)
3. Di halaman database, buka tab **REST API**, copy `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` ke `.env`

### Cloudinary
1. Buat akun di https://cloudinary.com (gratis)
2. Dashboard > copy `Cloud Name`, `API Key`, `API Secret` ke `.env` (`CLOUDINARY_*` dan `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`)
3. Buat **Upload Preset** unsigned: Settings (gear icon) > Upload > scroll ke "Upload presets" > Add upload preset
   - Signing Mode: **Unsigned**
   - Folder: kosongkan (folder ditentukan otomatis dari kode per jenis file)
   - Simpan, copy nama presetnya ke `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### JWT Secret
Generate string acak:
```bash
openssl rand -base64 32
```
Tempel hasilnya ke `JWT_SECRET`.

## 3. Setup Database

```bash
npx prisma migrate dev --name init
npm run seed
```

`seed` akan mengisi 3 paket: Bronze, Silver, Gold (sesuai pricing guide kamu).

## 4. Buat Akun Vendor (Admin) Pertama

```bash
npm run create-vendor -- kamu@email.com passwordkamu "Nama Vendor"
```

## 5. Jalankan

```bash
npm run dev
```

- Admin dashboard: http://localhost:3000/dashboard/login
- Setelah login, klik **+ Wedding Baru** untuk bikin event pertama
- Upload minimal 1 frame di halaman detail wedding, atur posisi slot di Frame Editor
- Buka link booth (`/w/[slug]`) di HP (atau browser lain) untuk coba alur tamu dari awal
- Buka link galeri (`/gallery/[gallerySlug]`) untuk lihat hasil submission

> Kamera/mic butuh HTTPS untuk device asli selain localhost. Untuk tes di HP fisik selagi development,
> pakai tunnel seperti `ngrok http 3000` supaya dapat URL HTTPS sementara.

## 6. Alur Lengkap yang Sudah Jadi

**Tamu:**
`/w/[slug]` (landing) → `/w/[slug]/frame` (pilih frame + nama) →
`/w/[slug]/capture/photo` atau `/capture/video` → `/w/[slug]/voice` (kalau paket termasuk voice note) →
`/w/[slug]/review` (compositing + preview) → `/w/[slug]/success` (download & share) →
`/gallery/[gallerySlug]` (publik, tanpa login)

**Vendor (admin):**
`/dashboard/login` → `/dashboard/booth-virtual/weddings` (list) →
`/dashboard/booth-virtual/weddings/new` (buat event + pilih paket) →
`/dashboard/booth-virtual/weddings/[id]` (detail, link booth & galeri) →
`.../frames/new` (upload desain frame) → `.../frames/[frameId]/editor` (drag & drop posisi slot) →
`.../submissions` (lihat semua kenangan tamu)

## 7. Deploy ke Vercel

1. Push project ini ke GitHub
2. Import repo di https://vercel.com
3. **PENTING**: ganti database ke Postgres untuk production — SQLite tidak persist di Vercel serverless.
   - Buat database gratis di https://neon.tech atau pakai Vercel Postgres (Storage tab di project Vercel)
   - Di `prisma/schema.prisma`, ganti:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
   - Commit & push perubahan itu
4. Di Vercel project settings > Environment Variables, isi semua variabel dari `.env` (DATABASE_URL pakai connection string Postgres, `NEXT_PUBLIC_BASE_URL` diisi domain Vercel kamu)
5. Deploy. Setelah live, jalankan migrasi & seed sekali dari lokal dengan `DATABASE_URL` production:
   ```bash
   DATABASE_URL="<connection-string-postgres>" npx prisma migrate deploy
   DATABASE_URL="<connection-string-postgres>" npm run seed
   DATABASE_URL="<connection-string-postgres>" npm run create-vendor -- kamu@email.com passwordkamu "Nama Vendor"
   ```

## 8. Struktur Folder Penting

```
prisma/schema.prisma       → skema database (Vendor, BoothPackage, Wedding, FrameTemplate, GuestSubmission)
prisma/seed.ts              → isi 3 paket
prisma/create-vendor.ts     → bikin akun admin
src/lib/                    → prisma client, redis, cloudinary, auth (JWT), session wizard, upload client
src/middleware.ts           → proteksi /dashboard/booth-virtual/*
src/components/             → FilmstripSteps, FrameSlotEditor, AdminTopbar
src/app/w/[slug]/           → semua halaman wizard tamu
src/app/gallery/[gallerySlug]/ → galeri publik
src/app/dashboard/          → login + dashboard vendor
src/app/api/                → semua API routes (tamu & admin)
```

## 9. Catatan & Batasan yang Perlu Kamu Tahu

- **Frame Editor** menyimpan posisi slot dalam persen (0..1), bukan pixel, supaya konsisten di ukuran render berapapun.
- **Compositing** dilakukan via Cloudinary transformation URL (server membangun URL, bukan render gambar sendiri) — cepat dan gratis-tier friendly, tapi hasil akhirnya bergantung pada urutan layer yang dibangun di `src/lib/cloudinary.ts`. Kalau hasil compositing meleset dari yang diharapkan, itu tempat pertama yang perlu dicek.
- **Upload unsigned** dipakai supaya tamu bisa upload langsung dari browser tanpa lewat server (hemat kuota serverless function Vercel yang gratis). Konsekuensinya: preset upload bersifat publik — jangan taruh data sensitif di sana.
- **Rate limit** submission di Redis masih sederhana (3x per menit per sesi) — cukup untuk cegah spam ringan, bukan proteksi keamanan penuh.
- Belum ada halaman "lupa password" untuk vendor — kalau lupa, jalankan ulang `npm run create-vendor -- email passwordbaru nama` (script ini pakai upsert, jadi aman dipakai ulang untuk reset password).
