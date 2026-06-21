# NEXA Campus — Hotfix: Build Error di `admin/verifications/page.tsx`

## Apa yang terjadi
Build production lo gagal dengan error:
```
./src/app/dashboard/admin/verifications/page.tsx
42:50  Error: `"` can be escaped with `&quot;`...  react/no-unescaped-entities
```
Penyebab: ada tanda kutip ganda literal (`"Verified by NEXA"`) langsung di teks JSX. Next.js
ESLint (`react/no-unescaped-entities`) menolak ini sebagai **error**, bukan cuma warning — jadi
`next build` gagal total.

## Kenapa ini lolos dari semua validasi gue sebelumnya
Gue jujur: di sandbox testing gue, `next.config.js` ada `eslint: { ignoreDuringBuilds: true }` —
jadi ESLint **gak pernah beneran jalan** di semua `next build` yang gue lakuin sepanjang sesi
ini. Validasi gue selama ini cuma nutupin `tsc` (cek tipe) + bundling, bukan lint rules kayak
`react/no-unescaped-entities`. Itu gap nyata di metodologi testing gue.

**Sudah diperbaiki:** sandbox gue sekarang pakai ESLint asli (`eslint-config-next@14.2.35`,
config `next/core-web-vitals`, sama persis kayak project lo) tanpa `ignoreDuringBuilds`. Build
ulang dengan setup ini menghasilkan **warning yang identik** dengan log Vercel lo (warning
`<img>` di file-file lama, dll) dan **nol error** — confirmed sandbox sekarang benar-benar
mencerminkan build production lo.

## Fix
| File | Perubahan |
|---|---|
| `src/app/dashboard/admin/verifications/page.tsx` | Tanda kutip diganti `&quot;` — **ini fix untuk error yang lo laporkan** |
| `src/components/admin/VerificationReviewPanel.tsx` | Bonus: `load()` dibungkus `useCallback` — ESLint juga nge-flag warning `react-hooks/exhaustive-deps` di file ini (terlihat di log lo juga), sudah dibereskan |
| `src/components/verification/VerificationProgressCard.tsx` | Konsistensi: pola `useCallback` yang sama (tidak ke-flag ESLint, tapi dibenerin sekalian biar aman dari perbedaan versi linter) |
| `src/components/verification/SkillEvidenceForm.tsx` | Sama seperti di atas |

## Validasi
- `tsc --noEmit`: 0 error.
- `next build` dengan ESLint **aktif** (bukan di-skip): 0 error, 0 warning di ke-4 file ini.
- Warning yang tersisa di build (`<img>` di 8 file lama, dll) **sama persis** dengan log Vercel
  kamu — itu semua dari kode lama kamu sendiri, bukan dari batch manapun yang gue kirim, dan
  tidak menggagalkan build (cuma warning, bukan error).

## Cara pasang
Timpa 4 file di atas. Tidak ada perubahan lain.
