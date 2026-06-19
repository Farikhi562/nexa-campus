# NEXA Campus — Batch 8: Fix Hamburger Mobile + Bahasa di Seluruh Navigasi

## 🔴 1. Fix bug hamburger mobile — "gak bisa liat semua halaman"

**Akar masalah:** di Batch 5, drawer hamburger (`MobileNavMenu.tsx`) di-rewrite dan
kehilangan constraint tinggi yang benar (`h-dvh` + `min-h-0`) yang ada di versi original.
Tanpa itu, di sejumlah browser mobile area `<nav>` yang seharusnya `overflow-y-auto` tidak
benar-benar ter-constrain tingginya, jadi tidak bisa di-scroll — item paling bawah
(Pengaturan, Support, Rilis, Admin) jadi tidak terjangkau. Ini makin kerasa sekarang karena
daftar menu sudah nambah jadi 19 item (dulu ~15).

**Fix:** `components/MobileNavMenu.tsx` — drawer sekarang pakai `h-dvh` (dynamic viewport
height, ngikutin tinggi layar yang BENERAN kelihatan di mobile, robust terhadap address bar
collapse/expand) + `min-h-0` di container flex-nya + header dibikin `flex-shrink-0` eksplisit.
Pola ini sama persis dengan yang dipakai versi original sebelum Batch 5 — sekarang dikembalikan
dan diperkuat.

**Bonus fix kecil:** desktop sidebar (`CollapsibleSidebar.tsx`) sebelumnya **tidak** menyaring
item khusus NEXA Command (beda dari hamburger mobile yang sudah benar) — jadi user non-Command
tetap lihat link "NEXA Assistant" di sidebar desktop (klik baru kena upgrade screen). Sekarang
disamakan: kedua nav (desktop & mobile) konsisten menyaring item Command-only. `AppShell.tsx`
diupdate untuk meneruskan `isCommand` ke `CollapsibleSidebar` juga.

## ✨ 2. Bahasa beneran ganti di semua navigasi — bukan cuma dropdown avatar

**Penyebab sebenarnya:** ada **2 sistem bahasa yang gak nyambung**:
- `lib/i18n.tsx` — context terpisah, dipasang tapi **tidak dipakai komponen manapun** (dead code).
- `components/LanguageProvider.tsx` — context yang BENERAN aktif (dipasang di `app/layout.tsx`),
  tapi **cuma dikonsumsi oleh `AvatarMenu.tsx`** (dropdown avatar di pojok kanan atas) untuk 6
  string kecil (Lihat Profil, Leaderboard, Pencapaian, Pengaturan, Bahasa, Keluar).

Sementara itu, **semua label navigasi** (sidebar desktop, hamburger mobile, bottom nav mobile,
`DashboardNavigation`) hardcode teks Bahasa Indonesia langsung di `nav-items.ts` — sama sekali
tidak terhubung ke sistem bahasa. Makanya ganti bahasa di Settings cuma ngubah dropdown avatar,
sisanya tetap Indonesia. Persis seperti yang kamu laporkan.

**Fix:** keempat permukaan navigasi (yang nempel di **setiap halaman dashboard**) sekarang
benar-benar terhubung ke sistem bahasa:

| File | Perubahan |
|---|---|
| `components/LanguageProvider.tsx` | Dictionary ditambah ~17 key baru: nav_assistant, nav_notifications, nav_release, bottom_*, section_*, badge_* |
| `components/dashboard/nav-items.ts` | Tiap item nav dapat `labelKey` (kunci terjemahan); `label` lama dipertahankan sebagai fallback, tidak ada yang dihapus |
| `components/MobileNavMenu.tsx` | Render via `t(labelKey)` — sekaligus fix bug scroll di atas |
| `components/dashboard/CollapsibleSidebar.tsx` | Render via `t(labelKey)`, header "Navigasi" ikut diterjemahkan |
| `components/MobileBottomNav.tsx` | Render via `t(labelKey)` dengan label pendek khusus (Home/Arena/Teman/Study/Tambah) |
| `components/dashboard/DashboardNavigation.tsx` | Ikut diupdate untuk konsistensi (komponen ini sebenarnya tidak dipakai di mana pun saat ini — orphan — tapi tetap disertakan biar tidak ada kode usang yang nyangkut kalau suatu saat dipakai) |
| `components/AppShell.tsx` | Teruskan `isCommand` ke `CollapsibleSidebar` (lihat bonus fix di atas) |

**Hasil:** ganti bahasa di Settings (atau dari dropdown avatar) sekarang langsung mengubah label
di sidebar desktop, hamburger mobile, bottom nav mobile, dan dropdown avatar — semuanya
serempak, tanpa reload (context React, sinkron lewat custom event + localStorage seperti
sebelumnya).

---

## ⚠️ Yang BELUM tercakup — perlu kamu putuskan skopenya

Yang saya kerjakan adalah **navigasi/chrome** (yang nempel di semua halaman). **Isi/konten tiap
halaman** (kartu-kartu di Dashboard, deskripsi & form di Arena, chat di Study Room, form di
Friends/Deadlines/Settings/Billing, dst) **masih hardcoded Bahasa Indonesia** — ini PR yang jauh
lebih besar: puluhan halaman, ratusan string teks, masing-masing perlu dibaca & ditranslate
satu per satu. Saya sengaja tidak menebak/main asal translate semuanya sekaligus karena
risikonya tinggi (salah konteks, kepanjangan dari layout, dll).

Kalau kamu mau lanjut ke translate isi halaman, kasih tau halaman mana yang paling prioritas
(mis. Dashboard dulu, atau Arena dulu), nanti saya kerjakan bertahap per halaman dengan cara
yang sama (baca isi asli → bikin translation key → wire `t()` → verifikasi).

---

## Cara pasang
1. Timpa 7 file di atas.
2. `npm run build` — sudah divalidasi hijau (full `tsc --noEmit` + `next build` produksi
   terhadap source asli kamu + overlay ini, 73/73 halaman, 0 error).
3. Test cepat: buka hamburger mobile di layar kecil → scroll ke bawah → pastikan
   Pengaturan/Support/Rilis/Admin kelihatan & bisa diklik. Lalu buka Settings → ganti bahasa ke
   English/中文 → cek sidebar & hamburger & bottom nav ikut berubah seketika.

## Catatan teknis
- Tidak ada migration SQL, tidak ada ENV baru.
- `lib/i18n.tsx` (sistem lama yang dead code) **tidak disentuh** — aman dibiarkan, tidak
  memengaruhi apa pun karena memang tidak dipakai di manapun. Bisa dihapus kapan saja kalau mau
  beres-beres, tapi tidak mendesak.
- Diverifikasi dengan 17 test assertion runtime: kelengkapan terjemahan tiap nav item di 3
  bahasa, filtering admin/Command per item, dan perilaku fallback.
