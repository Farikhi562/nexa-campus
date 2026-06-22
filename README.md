# NEXA Campus — Batch 19: Security Headers + img→Image + Verification Settings

## Validasi
- `tsc --noEmit` standar: 0 error
- `tsc --noEmit` target ES5 (strict): 0 error
- `next build` dengan ESLint aktif: **0 error, 0 warning** — build log bersih total
  (sebelumnya ada 12+ `no-img-element` warning + 1 `typingTimeoutRef` warning di SETIAP build)

## 1) Security Headers (`next.config.js`)

5 header baru ditambahkan ke SEMUA route (`/(.*)`):

| Header | Nilai | Fungsi |
|---|---|---|
| `X-DNS-Prefetch-Control` | `on` | Percepat DNS prefetch |
| `X-Frame-Options` | `SAMEORIGIN` | Cegah clickjacking (situs tidak bisa di-embed di iframe pihak lain) |
| `X-Content-Type-Options` | `nosniff` | Cegah MIME sniffing attack |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | URL tidak bocor ke pihak ketiga via HTTP |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Batasi akses sensor perangkat |

**Kenapa tidak ada CSP?** Content Security Policy butuh penanganan `nonce` untuk
`unsafe-inline` Next.js, whitelist domain Supabase/Jitsi/Midtrans, dan pengujian menyeluruh.
Kalau salah, akan memblokir fitur app. Ini bisa ditambahkan di sesi berikutnya setelah
audit domain yang dipakai secara lengkap.

Juga ditambahkan `images.remotePatterns` untuk Supabase storage (`*.supabase.co`), yang
dibutuhkan agar `next/image` bisa load avatar dan attachment dari Supabase.

## 2) img → next/image (15 file)

**Semua** avatar image diganti dari `<img>` ke `<Image>` dengan dimensi yang tepat
berdasarkan container Tailwind (`h-10 w-10` = 40x40, dll). Ini:
- Menghapus 12+ warning dari build log production
- Mengaktifkan image optimization Next.js (lazy loading, webp conversion, responsive srcSet)
- Meningkatkan Lighthouse LCP score

Ukuran yang dipakai per konteks:
- Avatar 40×40 (h-10 w-10): ActivityFeed, ArenaTeam, FriendSuggestions, OnlineFriends, AvatarMenu dropdown
- Avatar 36×36 (h-9 w-9): AvatarMenu button
- Avatar 44×44 (h-11 w-11): Arena ProfileAvatar
- Avatar 48×48 (h-12 w-12): FriendsView
- Avatar 96×96 (h-24 w-24): PublicUserProfileView
- Avatar dinamis (h-7/h-9/h-12): StudyRoomDetail Avatar, StudyRoomView Avatar
- Attachment chat: `width={800} height={600}` (full quality, CSS membatasi visual)

**Pengecualian (tetap `<img>` + eslint-disable):**
- `ProfileSettingsForm.tsx` dan `OnboardingForm.tsx` — preview foto dari `FileReader.readAsDataURL()`
  menghasilkan blob: URL yang tidak bisa diproses next/image. Ini behaviour yang benar.

## 3) Verification → Settings Profile

`SkillEvidenceForm` dan `VerificationProgressCard` (sudah dibuat di Batch 7.1 tapi belum
di-pasang ke halaman manapun) sekarang tampil di `/dashboard/settings/profile`, tepat di
bawah form profil utama.

- User bisa tambah/hapus bukti skill (link GitHub, portfolio, sertifikat) langsung dari settings
- Checklist syarat verifikasi lengkap dengan progress status
- Tombol ajukan verifikasi kalau semua syarat terpenuhi
- Status review ditampilkan (pending/ditolak + catatan reviewer)

## 4) Fix pre-existing warning: `typingTimeoutRef`

Warning `react-hooks/exhaustive-deps` di `StudyRoomDetail.tsx` sudah ada sejak lama.
Diperbaiki dengan capture `typingTimeoutRef.current` di awal effect (sebelum setup channel)
dan gunakan variabel tersebut di cleanup — ini pattern standar React untuk ref object (berbeda
dari DOM ref: karena keduanya menunjuk ke OBJEK yang sama, mutasi dalam effect tetap terlihat
di cleanup).

## Cara Pasang
1. Timpa `next.config.js` (WAJIB buat Image optimization bekerja — butuh `remotePatterns`)
2. Timpa semua file component di atas (17 file)
3. Timpa `src/app/dashboard/settings/profile/page.tsx`
4. `npm run build` → harusnya sepenuhnya bersih, 0 warning
5. Test cepat: buka `/dashboard/settings/profile` → scroll ke bawah → ada section
   "Bukti Skill & Verifikasi" dengan form evidence dan checklist verifikasi
