# NEXA Campus v1.0.0 Beta Testing Checklist

## 1. Auth

- Open `/login`.
- Click Google OAuth.
- Confirm user lands on `/onboarding` for new user or `/dashboard` for completed profile.
- Open `/login` while authenticated, confirm user is redirected to dashboard.

## 2. Profile

- Open `/dashboard/settings/profile`.
- Update name, campus, province, major, semester, gender optional.
- Upload a JPG/PNG/WebP photo under 2MB.
- Confirm profile saves without CORS error.

## 3. Deadline Core

- Open `/dashboard/deadlines/new`.
- Add deadline manually.
- Confirm it appears on `/dashboard`.
- Edit deadline.
- Quick complete from dashboard.
- Undo complete.
- Delete deadline with confirmation.

## 4. AI Quick Add

- Set user plan to `pulse` or `command`.
- Add `GEMINI_API_KEY` to server env.
- Open `/dashboard/deadlines/quick-add`.
- Paste raw text from WA/VClass/email.
- Extract deadline.
- Edit preview cards.
- Click `Simpan Semua`.

## 5. Telegram

- Add `TELEGRAM_BOT_TOKEN` and restart server/deploy.
- Open `/dashboard/settings/reminders`.
- Input Telegram chat ID.
- Save settings.
- Click test Telegram.
- Confirm message arrives.

## 6. Referral

- Open dashboard and copy referral link.
- Sign up in incognito using `?ref=CODE`.
- Complete onboarding.
- Confirm row appears in `referrals`.
- Confirm referrer gets Pulse trial.

## 7. Admin

- Add admin email to `ADMIN_EMAILS`.
- Open `/admin`.
- Confirm beta users and subscription intents load.
- Create an upgrade intent from user account.
- Confirm or reject from admin panel.
- Open `/admin/readiness`.
- Confirm required env status.

## 8. Mobile

- Open site from mobile viewport.
- Confirm mobile install prompt appears.
- Confirm dashboard navigation is usable.
- Confirm forms do not overflow.

## 9. Production Commands

Run before sharing:

```bash
npm run lint
npm run build
```

## 10. Honest Beta Notes

- Do not claim NEXA is official campus system.
- Do not claim VClass/iLab auto scraping.
- Do not claim WhatsApp reminder is live until Wablas integration is done.
- Do not claim AI is always accurate.
