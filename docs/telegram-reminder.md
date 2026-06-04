# Telegram Reminder Setup

Telegram reminder NEXA Campus bersifat optional dan harus graceful saat env belum tersedia.

## Environment Variables

Set di Vercel/local `.env.local`:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
CRON_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

`TELEGRAM_BOT_TOKEN` dibuat dari BotFather.

`TELEGRAM_WEBHOOK_SECRET` opsional, tapi direkomendasikan untuk memvalidasi webhook Telegram.

`CRON_SECRET` wajib untuk menjalankan reminder runner:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://campus.nexatechlabs.my.id/api/reminders/run
```

## Webhook

Set webhook Telegram ke:

```text
https://campus.nexatechlabs.my.id/api/telegram/webhook
```

Jika memakai secret token, set via Telegram API dengan `secret_token` yang sama dengan `TELEGRAM_WEBHOOK_SECRET`.

Saat user chat bot, bot akan membalas Chat ID. User memasukkan Chat ID itu ke settings reminder NEXA Campus.

## Reminder Behavior

Endpoint `/api/reminders/run` mengirim reminder Telegram untuk:

- deadline hari ini
- deadline H-1
- `reminder_enabled = true`
- `status != completed`

NEXA hanya mengingatkan deadline yang user input manual. NEXA tidak mengambil data dari VClass, iLab, Studentsite, BAAK, atau sistem kampus lain.
