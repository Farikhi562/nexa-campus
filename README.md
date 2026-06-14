# NEXA Campus v1.6.30 — Billing Admin Suite

Patch ini nge-upgrade manual payment biar nggak lagi approve lewat endpoint doang, karena Postman bukan admin panel, itu ritual HTTP. ANJJJ 😭

## Yang ditambah

### 1. Admin Payment Dashboard
File baru:
- `src/app/admin/payments/page.tsx`
- `src/components/admin/AdminPaymentsPanel.tsx`

URL:
- `/admin/payments`

Fitur:
- list order manual payment
- filter status
- search order/nama/WA/email
- lihat bukti transfer
- approve order
- reject order + alasan
- statistik total/pending/approved

### 2. Upload bukti transfer user
File baru:
- `src/app/api/billing/manual-payment/[orderId]/proof/route.ts`

File ditimpa:
- `src/components/billing/ManualPaymentCard.tsx`

Flow user:
1. Buka `/dashboard/billing`
2. Pilih Pulse/Command
3. Pilih Bank Jago atau BRI QRIS
4. Buat order
5. Bayar
6. Upload bukti JPG/PNG/WEBP/PDF maksimal 5MB
7. Status jadi `under_review`
8. Admin approve dari `/admin/payments`

### 3. Admin API lebih rapi
File ditimpa:
- `src/app/api/admin/billing/manual-payment/route.ts`

Fitur:
- GET list orders + profile user
- PATCH approve/reject
- anti approve ulang order yang sudah final
- auto update `profiles.plan`, `plan_status`, `plan_started_at`, `plan_expires_at`
- notif user via `notifyUser`
- audit log ke `payment_audit_logs`

### 4. Expire order otomatis
File baru:
- `src/app/api/cron/expire-payment-orders/route.ts`

Vercel Cron contoh:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-payment-orders?secret=ISI_CRON_SECRET_LU",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 5. Feature gate helper
File baru:
- `src/lib/billing/access.ts`

Ini helper buat ngunci fitur per plan:
- Radar: basic
- Pulse: unlimited deadline, weekly summary, Telegram
- Command: custom reminder, AI quick add, Ask NEXA premium, WhatsApp/email notif

## SQL Migration
Jalankan di Supabase SQL Editor:

- `supabase/migrations/20260615_billing_admin_suite.sql`

Yang dibuat:
- hardening `manual_payment_orders`
- tabel `payment_audit_logs`
- bucket Storage `payment-proofs`
- index tambahan
- RLS policy aman buat user order

## ENV wajib
Tambahin di Vercel:

```env
ADMIN_EMAILS=emailadminlu@gmail.com
SUPABASE_SERVICE_ROLE_KEY=xxxxx
CRON_SECRET=xxxxx
NEXT_PUBLIC_NEXA_PAYMENT_WHATSAPP=628xxxxxxxxxx

NEXT_PUBLIC_BANK_JAGO_NAME=Bank Jago
NEXT_PUBLIC_BANK_JAGO_ACCOUNT_NUMBER=100157134050
NEXT_PUBLIC_BANK_JAGO_ACCOUNT_NAME=Muhamad Fauzan Al Farikhi

NEXT_PUBLIC_BRI_QRIS_BANK_NAME=BRI QRIS / BRImo
NEXT_PUBLIC_BRI_QRIS_NUMBER=0335 0110 7723 508
NEXT_PUBLIC_BRI_QRIS_ACCOUNT_NAME=Muhamad Fauzan Al Farikhi
NEXT_PUBLIC_BRI_QRIS_IMAGE_URL=/payment/bri-qris.jpg
```

`ADMIN_EMAILS` harus email akun lu yang login di NEXA Campus. Kalau nggak, `/admin/payments` bakal 403. Ya gimana, admin tanpa daftar admin itu namanya warga random.

## Cara pasang

1. Extract zip.
2. Copy semua file ke project utama.
3. Jalankan SQL migration di Supabase.
4. Isi env Vercel.
5. Jalankan lokal:
   ```bash
   npm run build
   ```
6. Kalau aman:
   ```bash
   git add -A
   git commit -m "feat: add manual payment admin dashboard"
   git push
   ```
7. Test:
   - `/dashboard/billing`
   - buat order Pulse + Bank Jago
   - upload bukti
   - buka `/admin/payments`
   - approve
   - cek `profiles.plan` berubah

## Catatan penting

Patch ini depend ke Batch 3 dan Batch 4 sebelumnya:
- `src/lib/supabase/server`
- `src/lib/supabase/admin`
- `src/lib/notifications/notify-user`
- `src/lib/billing/plans`

Kalau file itu belum ada, pasang batch sebelumnya dulu. Jangan loncat batch kayak nonton tutorial terus skip bagian install dependency, nanti nangis ke TypeScript.
