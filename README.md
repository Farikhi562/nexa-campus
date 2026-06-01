# NEXA Campus

NEXA Campus adalah MVP anti-lupa deadline untuk mahasiswa. Fokusnya sederhana: catat deadline tugas/praktikum dari berbagai sumber kampus, lihat yang paling dekat, dan siapkan reminder secara privacy-first.

## Scope MVP

- Deadline Dashboard
- Quick Add Deadline
- Reminder settings
- Pricing tier Radar, Pulse, Command
- Locked preview untuk AI Quick Add dan Ask NEXA
- Manual subscription intent, tanpa payment gateway otomatis

NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Supabase Auth Google OAuth
- Supabase Database + RLS

## Environment

Copy `.env.example` ke `.env.local`, lalu isi:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=
ADMIN_EMAILS=
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
CRON_SECRET=
```

Telegram env opsional untuk MVP. App tidak boleh crash saat token belum tersedia.

## Database

Jalankan `supabase/schema.sql` di Supabase SQL Editor. Schema ini hanya berisi tabel MVP:

- `profiles`
- `academic_deadlines`
- `reminder_preferences`
- `beta_signups`
- `subscription_intents`
- `reminder_logs`

RLS aktif dari awal. User hanya bisa membaca/mengubah data miliknya sendiri.

## Development

```bash
npm install
npm run dev
npm run build
```
