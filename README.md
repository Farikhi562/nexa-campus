# NEXA Campus v1.6.27 — Batch 4 Payment Methods Hotfix

Patch ini ngebenerin manual payment biar lebih aman dan nggak default Bank Jago terus pas user pilih QRIS. Drama kecil database, seperti biasa manusia menambah tabel lalu berharap semesta paham sendiri.

## Yang difix

- Payment method sekarang divalidasi ketat: cuma `bank_jago` atau `bri_qris`.
- Kalau frontend lama nggak kirim `payment_method`, fallback tetap `bank_jago` biar nggak langsung KO.
- Kalau frontend kirim metode ngawur, API balikin `400`.
- Data order BRI QRIS sekarang jelas masuk sebagai:
  - `payment_method`: `bri_qris`
  - `bank_name`: `BRI QRIS / BRImo`
  - `account_number`: `0335 0110 7723 508`
  - `account_name`: `Muhamad Fauzan Al Farikhi`
- `metadata` order ditambah detail payment lengkap.
- `order_code` dibuat lebih unik: `NEXA-<timestamp>-<random>`.
- Submit bukti bayar tidak lagi nge-null-in field lain kalau field itu nggak dikirim.
- Admin approve/reject lebih aman: order yang sudah approved/rejected nggak diproses ulang.
- SQL hardening nambah constraint `payment_method` dan trigger `updated_at`.

## Harga aktif

- NEXA Radar: Rp0
- NEXA Pulse: Rp18.000 / bulan
- NEXA Command: Rp30.000 / bulan

## Metode pembayaran

### Bank Jago

- No: `100157134050`
- a.n. `Muhamad Fauzan Al Farikhi`

### BRI QRIS / BRImo

- ID/No QR: `0335 0110 7723 508`
- a.n. `Muhamad Fauzan Al Farikhi`
- Image: `/public/payment/bri-qris.jpg`

## Cara pasang

1. Copy semua file di patch ini ke project utama.
2. Jalankan SQL migration baru:

```sql
supabase/migrations/20260615_manual_payment_methods_hardening.sql
```

3. Pastikan env Vercel sudah ada:

```env
NEXT_PUBLIC_BANK_JAGO_NAME=Bank Jago
NEXT_PUBLIC_BANK_JAGO_ACCOUNT_NUMBER=100157134050
NEXT_PUBLIC_BANK_JAGO_ACCOUNT_NAME=Muhamad Fauzan Al Farikhi

NEXT_PUBLIC_BRI_QRIS_BANK_NAME=BRI QRIS / BRImo
NEXT_PUBLIC_BRI_QRIS_NUMBER=0335 0110 7723 508
NEXT_PUBLIC_BRI_QRIS_ACCOUNT_NAME=Muhamad Fauzan Al Farikhi
NEXT_PUBLIC_BRI_QRIS_IMAGE_URL=/payment/bri-qris.jpg

NEXT_PUBLIC_NEXA_PAYMENT_WHATSAPP=628xxxxxxxxxx
ADMIN_EMAILS=emailadmin1@gmail.com,emailadmin2@gmail.com
```

4. Deploy ulang Vercel.
5. Test bikin order Pulse dengan Bank Jago.
6. Test bikin order Command dengan BRI QRIS.

## Test request

```http
POST /api/billing/manual-payment
Content-Type: application/json

{
  "plan": "pulse",
  "payment_method": "bank_jago"
}
```

```http
POST /api/billing/manual-payment
Content-Type: application/json

{
  "plan": "command",
  "payment_method": "bri_qris"
}
```

## Query cek hasil

```sql
select
  order_code,
  plan,
  amount,
  status,
  payment_method,
  bank_name,
  account_number,
  account_name,
  metadata,
  created_at
from public.manual_payment_orders
order by created_at desc
limit 10;
```

Kalau order QRIS masih kebaca Bank Jago, berarti frontend lama belum ketimpa atau API route belum ke-deploy. Ya, deploy itu bukan mitos, harus beneran dipencet/push.
