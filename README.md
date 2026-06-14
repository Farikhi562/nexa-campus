# NEXA Campus v1.6.26 — Batch 4 Fix Payment Methods

Patch ini memperbaiki Batch 4: metode pembayaran sekarang bukan cuma Bank Jago, tapi ada 2 metode:

1. **Bank Jago Transfer**
   - Nomor rekening: `100157134050`
   - Nama: `Muhamad Fauzan Al Farikhi`

2. **BRI QRIS / BRImo**
   - Nomor/ID QR: `0335 0110 7723 508`
   - Nama: `Muhamad Fauzan Al Farikhi`
   - File QR default: `/public/payment/bri-qris.jpg`

## Harga aktif

- NEXA Radar: Rp0
- NEXA Pulse: Rp18.000 / bulan
- NEXA Command: Rp30.000 / bulan

## File yang berubah

- `src/lib/billing/plans.ts`
- `src/components/billing/ManualPaymentCard.tsx`
- `src/app/api/billing/manual-payment/route.ts`
- `src/app/api/billing/manual-payment/[orderId]/route.ts`
- `src/app/api/admin/billing/manual-payment/route.ts`
- `supabase/migrations/20260615_manual_payment_two_methods.sql`
- `public/payment/bri-qris.jpg`

## Cara pasang

1. Copy semua file ke project utama.
2. Jalankan migration SQL:
   - `supabase/migrations/20260615_manual_payment_two_methods.sql`
3. Isi env di Vercel.
4. Deploy ulang.
5. Test `/dashboard/billing`.

## Env Vercel

```env
NEXT_PUBLIC_BANK_JAGO_NAME=Bank Jago
NEXT_PUBLIC_BANK_JAGO_ACCOUNT_NUMBER=100157134050
NEXT_PUBLIC_BANK_JAGO_ACCOUNT_NAME=Muhamad Fauzan Al Farikhi

NEXT_PUBLIC_BRI_QRIS_BANK_NAME=BRI
NEXT_PUBLIC_BRI_QRIS_NUMBER=0335 0110 7723 508
NEXT_PUBLIC_BRI_QRIS_ACCOUNT_NAME=Muhamad Fauzan Al Farikhi
NEXT_PUBLIC_BRI_QRIS_IMAGE_URL=/payment/bri-qris.jpg

NEXT_PUBLIC_NEXA_PAYMENT_WHATSAPP=628xxxxxxxxxx
ADMIN_EMAILS=emailadmin1@gmail.com,emailadmin2@gmail.com
```

## Flow user

1. User buka `/pricing` atau `/dashboard/billing`.
2. User pilih Pulse atau Command.
3. User pilih metode pembayaran: Bank Jago atau BRI QRIS.
4. App create order ke `/api/billing/manual-payment`.
5. User bayar sesuai nominal.
6. User konfirmasi ke admin via WhatsApp dengan Order ID.
7. Admin approve via API admin.
8. Sistem update `profiles.plan`, `profiles.plan_status`, `profiles.plan_started_at`, `profiles.plan_expires_at`.

## Request create order

```http
POST /api/billing/manual-payment
Content-Type: application/json

{
  "plan": "pulse",
  "payment_method": "bank_jago"
}
```

Atau:

```http
POST /api/billing/manual-payment
Content-Type: application/json

{
  "plan": "command",
  "payment_method": "bri_qris"
}
```

## Catatan penting soal QR

Screenshot QR yang dikasih punya teks berlaku 24 jam dan 1x transaksi. Kalau itu memang QR dinamis BRImo, jangan dipakai permanen buat publik. Untuk sementara patch ini tetap masukin QR ke `/public/payment/bri-qris.jpg`, tapi kalau sudah punya QRIS statis beneran, ganti file itu. Jangan sampai user bayar ke QR expired terus semua pihak pura-pura jadi korban teknologi. ANJJJ 😭

## Dependensi

Patch ini masih depend ke Batch 3 untuk:

- `src/lib/notifications/notify-user.ts`
- `src/lib/supabase/admin.ts`

Kalau belum pasang Batch 3, pasang dulu. Jangan skip batch, ini codebase bukan episode filler anime.
