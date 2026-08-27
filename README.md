# Bintang Creator Hub

Codebase Next.js lengkap untuk platform manajemen creator Shopee Affiliate — modul Produk, Tutorial, dan Jadwal Webinar, dengan auth 2-layer (OAuth internal + ID/Password Creator) dan Row Level Security 3-role.

Ini codebase siap-deploy, tapi **belum tersambung ke infrastruktur apa pun** — kamu perlu isi kredensial milikmu sendiri di langkah 2–4 di bawah.

## 1. Install dependency

```bash
npm install
```

## 2. Buat project Supabase

1. Buka [supabase.com](https://supabase.com) → New Project
2. Buka **SQL Editor**, jalankan seluruh isi `supabase/migrations/0001_init.sql`
3. Buka **Storage**, buat bucket baru bernama `product-images` (public)
4. Buka **Authentication > Providers**, aktifkan **Google** untuk login internal (Layer 1)
5. Buka **Project Settings > API**, salin `URL`, `anon public key`, dan `service_role key`

## 3. Isi environment variables

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan nilai dari langkah 2. Untuk `CREATOR_EMAIL_DOMAIN`, bebas pilih domain apa saja — tidak perlu domain asli, ini cuma format internal untuk trik email sintetis Creator (lihat `lib/supabase/creator-auth.ts`).

## 4. Buat akun pertama secara manual

Karena Creator dan CM tidak melakukan self-signup, buat baris awal manual dulu di Supabase:

1. Di **Authentication > Users**, klik **Add user**, buat 1 user untuk dirimu sendiri (email asli, untuk login internal)
2. Di **Table Editor > cm_profiles**, insert baris dengan `id` = id user tadi, `role` = `super_admin`
3. Untuk Creator: buat user baru di Authentication dengan email format `{creator_code}@{CREATOR_EMAIL_DOMAIN}` (contoh: `ba-cr-01245@internal.bintangcreatorhub.app`), lalu insert baris di tabel `creators` dengan `id` yang sama dan `creator_code` = `BA-CR-01245`

## 5. Jalankan lokal

```bash
npm run dev
```

Buka `http://localhost:3000`.

## 6. Setup n8n (opsional untuk auto-fetch gambar & reminder)

1. Import `n8n-workflows/auto-fetch-gambar-produk.json` dan `n8n-workflows/reminder-webinar.json` ke instance n8n kamu
2. Tambahkan credential Supabase di n8n (Header Auth: `apikey` = anon key, `Authorization` = `Bearer {service_role key}`)
3. Salin URL webhook dari node "Webhook: produk baru", isi ke `N8N_WEBHOOK_URL` di `.env.local`
4. Ganti node "Kirim reminder" di workflow reminder webinar dengan channel pilihanmu (WhatsApp API/Email) — masih ditandai sebagai isu terbuka di rencana arsitektur

## 7. Deploy ke Vercel

1. Push project ini ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Masukkan semua environment variable dari `.env.local` ke Vercel Project Settings
4. Update `NEXT_PUBLIC_SITE_URL` jadi domain Vercel kamu, dan update Redirect URL OAuth Google di Supabase Auth settings supaya cocok

**Ingat**: Vercel Hobby (free tier) ditujukan untuk non-komersial. Aman untuk pilot internal, tapi upgrade ke Pro begitu ada Creator sungguhan pakai sistem ini untuk kerja nyata.

## Struktur project

```
app/
  login/internal/        Login Layer 1 (Super Admin & CM, OAuth Google)
  login/creator/         Login Layer 2 (Creator, ID + Password)
  api/auth/               Route handler login & OAuth callback
  (app)/                  Semua halaman setelah login (sidebar + topbar)
    dashboard/
    produk/
    tutorial/
    webinar/
lib/supabase/             Client Supabase (browser, server, auth Creator)
components/                Sidebar, Topbar, tombol logout
supabase/migrations/       Skema database + RLS
n8n-workflows/              Export workflow otomasi
```

## Yang belum diimplementasikan di codebase ini

Sesuai gap analysis di rencana arsitektur — hal-hal berikut sengaja belum dibangun karena masih jadi isu terbuka atau di luar scope fase prototype:

- Mekanisme reset password Creator (Layer 2)
- Channel reminder webinar final (masih placeholder Telegram di workflow n8n)
- Import XLSX & halaman kurasi BigQuery (fase komersial)
- Tampilan kalender bulanan penuh untuk Webinar (saat ini masih daftar berurutan per tanggal — cukup untuk skala pilot, bisa dikembangkan jadi grid kalender nanti)
