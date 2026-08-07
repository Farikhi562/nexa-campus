# Changelog Perbaikan NEXCAMP

Ini rangkuman semua perubahan yang sudah dibuat. Karena project ini di-zip tanpa
`package.json` / `node_modules`, semua perubahan dikerjakan lewat review kode
langsung (tanpa `next dev` / `next build`) — jadi sebelum deploy, tetap jalankan
`npm run build` dulu di lokal buat mastiin nggak ada typo yang lolos.

---

## 1. Bug: Badge di Achievements beda dengan di Profile (akar masalah)

**Temuan:** Ternyata bukan cuma beda tampilan — ada **dua sistem badge yang
terpisah total** di codebase:

- Sistem lama — `lib/badges.ts` (badge id kayak `rookie`, tier
  common/epic/rarest), dipakai lewat komponen `BadgeChip` /
  `FeaturedBadgePin`.
- Sistem baru "v4" — `lib/badges/catalog.ts` (badge key kayak
  `deadline_guard`, rarity biasa/langka/epic/legend/mythos), dipakai lewat
  `ProfileBadgeShowcase` / `PublicUserBadges` / `UnifiedBadgeStrip` /
  `BadgeCollection`. Ini yang dipakai halaman **Pencapaian**.

Kolom `profiles.featured_badge` (sumber data sistem lama) sudah nggak pernah
ditulis lagi sama UI manapun — jadi di 8 halaman berikut, badge yang tampil
kemungkinan besar **kosong/salah** buat sebagian besar user, bukan cuma beda
gaya:

- `components/profile/PublicUserProfileView.tsx` (halaman Profile)
- `components/dashboard/ArenaView.tsx` (Arena — post, member tim, pelamar)
- `components/dashboard/PrivateChatView.tsx` (Chat pribadi)
- `components/dashboard/FriendsView.tsx` (Daftar teman)
- `components/dashboard/OnlineFriendsStrip.tsx` (Strip teman online)
- `components/dashboard/LeaderboardView.tsx` (Papan peringkat, 2 tempat)
- `components/dashboard/FriendSuggestionsCard.tsx` (Saran teman)

**Perbaikan:** Semua 7 file di atas sekarang pakai komponen yang SAMA PERSIS
dengan halaman Pencapaian (`PublicUserBadges`, self-fetching dari
`/api/badges/[userId]`), lengkap dengan guard `id &&` supaya kalau id user
kosong, komponennya nggak diam-diam nampilin badge punya kamu sendiri di
sebelah nama orang lain.

**Belum disentuh (sengaja):** `lib/badges.ts`, `components/BadgeChip.tsx`,
dan sekitar 12 komponen wrapper (`components/dashboard/UserBadges.tsx`,
`ProfileBadges.tsx`, dll) yang sudah dikonfirmasi **dead code** (nggak
di-import di mana pun). Aman dihapus, tapi saya nggak hapus karena nggak ada
`package.json`/build tool di sini buat verifikasi otomatis. Kalau mau bersihin,
jalankan `tsc --noEmit` dulu setelah hapus buat mastiin nggak ada yang kelewat.

## 2. Bug: Tombol utama (`Button.tsx`) gradient biru-oranye, beda sendiri dari 29 halaman lain

`components/ui/Button.tsx` (dipakai 22 file) defaultnya gradient
`blue-600 → orange-500`. Tapi 29 file lain di app ini (termasuk halaman
**Login** dan **Ganti Password**) sudah manual override ke warna biru solid
(`bg-blue-400`/`bg-blue-500`) — kemungkinan karena gradient itu kelihatan
salah/beda sendiri.

Masalahnya: `cn()` di project ini cuma `clsx` polos (nggak ada
tailwind-merge), jadi override lewat `className` **nggak dijamin menang**
lawan style bawaan komponen. Kemungkinan besar tombol Login & Ganti Password
diam-diam masih nampilin gradient lama meski sudah di-override manual.

**Perbaikan:**
- `Button.tsx` primary variant diganti ke `bg-blue-400 text-slate-950
  hover:bg-blue-300` — samain sama pola warna yang sudah dominan dipakai di
  seluruh app.
- Radius disamakan ke `rounded-2xl` (sebelumnya `rounded-lg`, beda sendiri).
- 2 tombol "Tambah Deadline" (`DeadlineList.tsx`,
  `app/dashboard/deadlines/page.tsx`) yang masih pakai gradient manual juga
  disamakan.
- Override warna yang sekarang redundan di `LoginClient.tsx` dan
  `UpdatePasswordClient.tsx` dihapus (sudah otomatis benar dari default
  `Button`).

## 3. Bug: Sebagian halaman bisa keluar setengah gelap (dark mode nggak lengkap)

8 file (5 di sistem badge baru, 5 di study room — overlap disebut sekali)
pakai class Tailwind `dark:` padahal app ini **sama sekali nggak punya**
theme provider / toggle dark mode. Karena Tailwind default merespons
`prefers-color-scheme` browser, kalau HP/laptop user disetel dark mode,
bagian2 ini bisa keluar gelap sementara 95% halaman lain tetap terang —
tampilan pecah/nggak konsisten.

**Perbaikan:** semua class `dark:` di 8 file berikut dihapus (murni class-nya
saja, style light-mode yang sudah ada di sampingnya tetap dipertahankan):

`components/badges/ProfileBadgeShowcase.tsx`,
`components/badges/UnifiedBadgeStrip.tsx`,
`components/badges/BadgeCollection.tsx`,
`components/study-room/StudyRoomVoiceNotesPage.tsx`,
`components/study-room/VoiceNoteRecorder.tsx`,
`components/study-room/JitsiRoomCall.tsx`,
`components/study-room/StudyRoomCommandActions.tsx`,
`components/study-room/VoiceNoteList.tsx`

## 4. Loading screen baru + animasi

Sebelumnya cuma **1 dari 17 halaman** dashboard yang punya `loading.tsx` —
sisanya blank/diam saat nunggu data. Skeleton yang ada juga bentuknya
khusus buat dashboard-home (grid 4 kartu), jadi salah bentuk kalau dipakai
di halaman lain.

**Perbaikan:**
- Komponen baru `components/ui/LoadingScreen.tsx`: logo NEXA yang float +
  glow halus (animasi CSS pakai keyframe yang sudah ada di `globals.css`,
  bukan bikin baru dari nol), dengan progress bar shimmer tipis di bawahnya.
  Ada 2 ukuran: `full` (splash gede, buat masuk pertama kali) dan `compact`
  (versi ringkas, buat pindah antar halaman biar nggak berat).
- Dipasang di `app/dashboard/loading.tsx` (full) dan **16 halaman dashboard
  lain + onboarding** (compact), masing-masing dengan label yang sesuai
  konteks halamannya (misal "Membuka daftar teman…", "Menghitung papan
  peringkat…").

## 5. Error state: nggak nampilin raw error ke user lagi

`app/dashboard/error.tsx` dan `components/ErrorBoundary.tsx` (yang terakhir
ternyata dead code / belum dipakai di mana pun) sebelumnya nampilin
`error.message` mentah + emoji besar ke user — kelihatan kayak layar debug
developer, bukan produk jadi.

**Perbaikan:** pesan diganti jadi ramah user, detail teknis cuma muncul kalau
`NODE_ENV === 'development'`. Warna tombol & card disamakan ke desain
konsisten (`Card` style: rounded-3xl, border-white/80, shadow-xl).

---

## Rekomendasi lanjutan (belum dikerjakan, di luar scope kali ini)

- **Bersihin dead code badge lama** setelah verifikasi build lokal — lihat
  bagian 1.
- **Copy/bahasa di beberapa tempat** (terutama `BadgeCollection.tsx`,
  halaman Pencapaian) masih pakai bahasa gaul yang cukup kasar/santai
  (contoh: "ANJJJ"). Saya nggak ubah karena ini soal brand voice, bukan bug —
  tapi worth dipikirin lagi kalau target audiens-nya makin luas atau buat
  keperluan Gemastik.
- **Badge di list panjang** (Leaderboard, Arena) masing-masing fetch badge
  sendiri-sendiri per baris (bisa puluhan request bersamaan kalau listnya
  panjang). Ini pola yang sudah ada dari sebelumnya, bukan yang saya
  perkenalkan — tapi kalau performa jadi masalah, pertimbangkan bikin 1
  endpoint batch (`/api/badges/batch?ids=...`) daripada N request terpisah.
- **Audit visual menyeluruh ke semua ~40 halaman** (biar "nggak keliatan AI"
  & "nggak rame") paling efektif dikerjakan sambil lihat hasil render
  langsung (`next dev` + browser) — di lingkungan chat ini saya nggak bisa
  render/screenshot halaman React sungguhan, jadi perbaikan di atas fokus ke
  yang bisa dipastikan benar lewat baca kode. Kalau mau lanjut audit visual,
  Claude Code (jalan di komputer kamu sendiri, bisa `npm run dev` + lihat
  browser) atau Claude in Chrome bakal jauh lebih efektif buat tahap ini.

---

## Update Round 2 — NEXA Assistant & Study Room

### NEXA Assistant: upload file, baca jadwal, belajar — disatukan & disederhanakan

Sebelumnya halaman NEXA Assistant isinya numpuk ke bawah: kartu link "Belajar
dari Materi" (harus klik, pindah halaman) → chat → panel Analisa Risiko ML.
Upload file untuk belajar juga cuma bisa diakses lewat halaman terpisah
`/dashboard/study`.

**Perbaikan:**
- Halaman NEXA Assistant sekarang pakai **3 tab** (komponen baru
  `components/ai/NexaAssistantWorkspace.tsx`), pola tab yang sama persis
  dengan yang sudah dipakai di halaman detail materi belajar (biar
  konsisten, bukan bikin gaya baru):
  - **Tanya NEXA** — chat seperti biasa.
  - **Belajar dari Materi** — form upload file (PDF/DOCX, maks 3MB — ini
    limit teknis dari batas ukuran body serverless, bukan dibuat-buat) atau
    tempel teks langsung tanpa pindah halaman, ditambah daftar materi
    terakhir yang sudah dibuat.
  - **Analisa Risiko** — panel ML yang sudah ada.
- Cuma satu tab yang tampil dalam satu waktu → nggak bikin pusing scroll
  panjang.
- "Baca jadwal" sekarang beneran kelihatan: panel di sebelah chat
  nampilin **daftar 3 deadline terdekat** (bukan cuma teks "X deadline
  dibaca otomatis") — supaya user percaya AI-nya emang paham jadwal
  mereka, bukan klaim kosong.

File yang berubah: `app/dashboard/nexa-assistant/page.tsx`,
`components/ai/NexaAssistantCommand.tsx` (baru), `components/ai/NexaAssistantWorkspace.tsx` (baru).

### Study Room: fitur baru — Fokus Bareng (pomodoro tersinkron)

Ditambahkan fitur **timer fokus bareng** yang disinkronkan real-time ke semua
anggota room (siapa pun bisa lihat & mulai, lewat channel realtime yang
sudah ada — nggak perlu tabel database baru):

- Tombol kecil ⏱ di header room (nggak makan tempat kalau nggak dipakai).
- Klik → pilih durasi (15/25/50 menit) → semua anggota room yang lagi
  online langsung lihat bar tipis di atas chat: hitung mundur + nama yang
  mulai + progress bar.
- Yang mulai timer (atau admin/owner room) bisa stop kapan saja.
- Desain sengaja dibuat minim (1 baris tipis), nggak bikin layout chat yang
  sudah padat jadi tambah sesak.

**Keterbatasan yang perlu tahu:** karena ini murni broadcast realtime (tanpa
disimpan ke database), anggota yang baru buka room **di tengah** sesi fokus
yang sedang jalan nggak otomatis lihat timer-nya sampai ada event baru
(misalnya sampai timer di-stop/di-restart). Kalau mau timer-nya persisten
(tersimpan, kelihatan meski baru join), perlu tabel database baru — saya
nggak bikin itu di sini karena butuh migration yang harus dijalankan manual
di Supabase kamu.

File yang berubah: `components/dashboard/StudyRoomDetail.tsx`,
`components/study-room/FocusTimerBar.tsx` (baru).
