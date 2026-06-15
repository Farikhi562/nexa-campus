# NEXA Campus Build Fix

Isi zip ini:

1. Semua file Batch 7 Smart Input Engine dari zip awal.
2. `src/app/dashboard/page.tsx` yang sudah dipasang `<SmartInputBox />` sesuai README.
3. `scripts/fix-push-notification-settings.mjs` untuk memperbaiki error Vercel:

```txt
src/components/settings/PushNotificationSettings.tsx
react/no-unescaped-entities di line 221
```

## Cara pakai

Copy/replace folder `src` dari zip ini ke project NEXA Campus.

Lalu di root project jalankan:

```bash
node scripts/fix-push-notification-settings.mjs
npm run build
```

Kalau build sudah hijau:

```bash
git add .
git commit -m "fix: add smart input dashboard and escape push notification quotes"
git push
```

## Catatan

Warning `<img>` dari Next.js belum bikin build gagal. Error yang bikin gagal adalah tanda kutip mentah di JSX text file `PushNotificationSettings.tsx`.
