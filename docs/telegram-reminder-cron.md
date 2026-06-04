# Telegram Reminder Cron

Endpoint worker:

```txt
POST /api/reminders/telegram/send-due
Authorization: Bearer <CRON_SECRET>
```

Environment variables:

```env
TELEGRAM_BOT_TOKEN=
CRON_SECRET=
```

Recommended schedule for MVP beta:

```txt
Every day at 08:00 Asia/Jakarta
```

Vercel Cron can call the endpoint daily. If using an external scheduler, make sure the request includes:

```txt
Authorization: Bearer isi_CRON_SECRET
```

Reminder behavior:

- Sends Telegram reminders for deadlines with `reminder_enabled = true`.
- Only reads deadlines with status `pending` or `in_progress`.
- Supports H-7, H-3, H-1, and Hari-H based on user reminder preference.
- If `reminder_logs` table does not exist, the worker still sends Telegram and skips logging.

Important:

- The bot only sends reminders for deadlines manually entered by users.
- NEXA Campus does not read VClass, iLab, Studentsite, or official campus systems.
- Users must provide a valid Telegram chat ID and start the bot first.
