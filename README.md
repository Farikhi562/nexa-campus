# NEXA Campus v1.6.24 — Batch 3

Patch ini lanjutan dari `v1.6.23-batch2`.

## Yang ditambah

### 1. NEXA Assistant lebih hidup
File timpa:
- `src/components/ai/AskNexaPanel.tsx`
- `src/app/api/ask-nexa/route.ts`
- `src/lib/ai/gemini.ts`
- `src/lib/ai/ask-nexa.ts`

File baru:
- `src/lib/ai/deadline-parser.ts`

Hasil:
- Bubble chat user sekarang bisa tampil nama + avatar asli dari `/api/user/profile`.
- User bisa ngetik deadline natural language, contoh:
  - `tambahin deadline tugas kalkulus besok jam 8 malam`
  - `catat deadline presentasi basis data Jumat pukul 10.30`
  - `input deadline laporan praktikum 20/06/2026 jam 23:59`
- API otomatis parse lalu insert ke `academic_deadlines`.
- Kalau insert gagal, response ngasih data yang berhasil diparse supaya gampang debug schema.

Catatan penting:
Patch ini asumsi tabel deadline bernama `academic_deadlines` dengan kolom:
`user_id`, `title`, `course_name`, `type`, `source`, `deadline_date`, `deadline_time`, `priority`, `status`, `reminder_enabled`.
Kalau schema lo beda, ubah bagian `insertPayload` di `src/app/api/ask-nexa/route.ts`.

### 2. Telegram + in-app notif bukan cuma reminder
File baru:
- `src/lib/supabase/admin.ts`
- `src/lib/notifications/notify-user.ts`
- `src/app/api/cron/nexa-engagement/route.ts`
- `supabase/migrations/20260615_nexa_assistant_notifications.sql`

Hasil:
- Ada tabel `notifications` buat notif di web app.
- Telegram bot bisa kirim daily digest/nudge, bukan cuma reminder tunggal.
- Cron route: `/api/cron/nexa-engagement`
- Proteksi optional pakai `CRON_SECRET`.

Env yang dibutuhkan:
```env
SUPABASE_SERVICE_ROLE_KEY=xxxxx
TELEGRAM_BOT_TOKEN=xxxxx
CRON_SECRET=bebas-yang-susah-ditebak
NEXT_PUBLIC_SITE_URL=https://campus.nexatechlabs.my.id
```

Vercel Cron contoh:
```json
{
  "crons": [
    {
      "path": "/api/cron/nexa-engagement?secret=bebas-yang-susah-ditebak",
      "schedule": "0 23 * * *"
    }
  ]
}
```
Jam `0 23 * * *` di Vercel UTC kira-kira jam 06:00 WIB. Karena tentu saja timezone harus ikut bikin hidup ribet.

### 3. Study Room voice/video call via Jitsi
File baru:
- `src/components/study-room/JitsiRoomCall.tsx`
- `src/app/dashboard/study-room/[roomId]/call/page.tsx`

URL contoh:
`/dashboard/study-room/room-abc/call`

Jitsi ini opsi paling waras buat MVP:
- tanpa backend media server,
- tanpa API key,
- langsung iframe.

## Urutan pasang

1. Copy/timpa semua file ke project utama.
2. Jalankan SQL migration di Supabase SQL Editor.
3. Pastikan env di Vercel sudah ada.
4. Deploy.
5. Test NEXA Assistant dengan kalimat:
   `tambahin deadline tugas kalkulus besok jam 8 malam`
6. Test cron manual:
   `/api/cron/nexa-engagement?secret=ISI_CRON_SECRET_LO`

## Yang belum dipaksa masuk

NEXA Arena team leaderboard + badge kompetisi dan Cari Teman by QR/NEXA ID perlu schema asli project utama. Di zip ini belum ada file arena/friends/database lengkap, jadi kalau dipaksa nebak bisa bentrok. Patch SQL sudah menambah `profiles.nexa_id` sebagai fondasi.
