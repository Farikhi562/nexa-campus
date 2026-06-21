# NEXA Campus — Fix: Badge Tidak Konsisten (Pencapaian vs Profil Publik)

## Bug yang dilaporkan
"Badge ga konsisten — yang di Pencapaian beda sama yang ditampilin di liat user lain."

## Akar masalah (sudah diverifikasi baca kode, bukan tebakan)
Ada **2 jalur badge yang terpisah**:
1. **Halaman Pencapaian** (`AchievementsView.tsx`) — menghitung badge **LIVE** dari stats asli
   (deadline selesai, streak, poin, dll) lewat `evaluateBadges()`. Selalu akurat & up-to-date.
2. **Profil publik** (lihat diri sendiri ATAU user lain) — membaca kolom `profiles.badges`.
   Kolom ini **TIDAK PERNAH ditulis oleh UI manapun** — ada endpoint `PATCH /api/profile/badges`
   untuk itu, tapi tidak dipanggil dari komponen manapun di seluruh codebase (diverifikasi via
   grep). Jadi kolom ini **selalu kosong** untuk semua user, dan profil publik cuma menampilkan
   badge tier plan (Radar/Pulse/Command) + 1 featured badge (kalau di-pin) — bukan badge
   pencapaian yang sebenarnya sudah didapat.

Itu sebabnya: user yang sudah dapat 8 badge di Pencapaian, profil publiknya cuma kelihatan 0-1
badge. Bukan masalah tampilan, tapi sumber datanya beda total.

## Fix
Profil publik sekarang **menghitung badge LIVE juga**, pakai fungsi yang sama persis dengan
Pencapaian — bukan baca kolom mati.

| File | Perubahan |
|---|---|
| `docs/MIGRATION_badge_consistency_fix.sql` | Tambah RPC `get_user_rank(p_user_id, p_scope)` — kembaran `get_my_rank` yang sudah ada, tapi di-parameterize per user (bukan terikat `auth.uid()`). `get_my_rank` asli **tidak disentuh sama sekali** (zero risk ke fitur yang sudah jalan). |
| `src/lib/achievement-stats.ts` **(BARU)** | `getAchievementStatsFor(userId, email)` — hitung `AchievementStats` lengkap untuk SATU user mana pun (diri sendiri atau orang lain), pakai service-role client + RPC baru di atas. |
| `src/app/api/achievements/route.ts` | Refactor pakai fungsi shared di atas — **perilaku tidak berubah**, cuma hapus duplikasi logic. |
| `src/app/api/profile/[id]/route.ts` | `badges` sekarang dihitung live (`evaluateBadges()` + filter `earned`) untuk profil yang sedang dilihat, bukan baca `profiles.badges`. |
| `src/app/api/profile/me/route.ts` | Sama, untuk konsistensi penuh di semua endpoint yang expose field `badges`. |

## Kenapa butuh RPC baru (bukan query langsung)
Poin & streak butuh agregasi dari `points_events`, yang **tidak bisa dibaca lintas-user** lewat
RLS biasa (ini benar, sudah diperketat di security hardening sebelumnya). RPC `get_my_rank` yang
sudah ada cuma bisa hitung punya **diri sendiri** (`auth.uid()` hardcoded). Daripada
reimplementasi logic streak (gaps-and-islands, window function) di JavaScript yang rawan bug
timezone, lebih aman copy persis logic yang sudah terbukti jalan, tinggal di-parameterize.
**Privasi tetap dijaga di level pemanggil** (route `profile/[id]` sudah punya gate
friend/`is_public_profile` dari batch sebelumnya) — RPC ini murni alat hitung, bukan penjaga akses.

## Validasi
- `tsc --noEmit`: 0 error.
- `next build` dengan ESLint aktif: 0 error, 0 warning baru.
- 12 test assertion: termasuk verifikasi bahwa `evaluateBadges()` menghasilkan output **identik**
  untuk stats yang sama baik dipanggil dari jalur "diri sendiri" maupun "lihat user lain" (intinya
  fix ini), badge founder tetap dapat semua, manual override tetap dihormati, dan rank `null`
  tidak ke-coerce jadi `0` (bug kecil yang ketemu & dibenerin saat menulis fix ini).
- **Migration belum dieksekusi ke Postgres live** — sarankan test manual: jalankan migration,
  cek `/dashboard/achievements` vs buka profil sendiri (`/dashboard/profile/[your-id]`), badge
  yang muncul harus sama persis.

## Cara pasang
1. Jalankan `docs/MIGRATION_badge_consistency_fix.sql`.
2. Timpa 4 file kode di atas.
3. Test: buka Pencapaian, catat badge yang earned → buka profilmu sendiri via halaman publik →
   harus muncul badge yang sama. Lalu cek dari akun lain, lihat profil user pertama tadi — badge
   yang muncul juga harus sama dengan yang di Pencapaian user tersebut.

## Catatan
`profiles.badges` (kolom lama) dan endpoint `PATCH /api/profile/badges` **tidak dihapus** —
dibiarkan ada (tidak dipakai lagi untuk display, tapi `manualBadgeIds` di `evaluateBadges()` masih
membacanya sebagai mekanisme override manual kalau suatu saat mau dipakai admin untuk grant badge
khusus di luar metric biasa). Tidak ada breaking change.
