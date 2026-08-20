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

---

## Update Round 3 — Bug AI flashcard/latihan, Panel Admin, NEXA Arena

### ⚠️ WAJIB: jalankan migration baru dulu

`supabase/migrations/20260807_admin_moderation.sql` — bikin kolom ban di
`profiles` + tabel `user_reports`. Tanpa ini, fitur ban & laporan akun di
bawah akan error. Jalankan manual di Supabase SQL editor.

### Bug besar: 6 fitur AI gagal karena konflik format JSON

Akar masalah "flashcard sama latihan belom bisa dipake": semua pemanggilan
AI di app ini pakai `json: true` yang MEMAKSA provider mengembalikan JSON
dengan root berupa *object* (`response_format: json_object`). Tapi prompt di
6 tempat ini minta AI balikin JSON *array* mentah — konflik ini bikin
provider AI menolak/membungkusnya dengan cara tak terduga, jadi hasilnya
gagal di-parse terus.

Diperbaiki (semua sekarang minta object dengan key jelas, mis.
`{"cards":[...]}`, sama seperti pola yang sudah terbukti jalan di generator
study pack utama):
- **Flashcard** (`lib/study/generate-flashcards.ts`)
- **Latihan/Practice** (file yang sama)
- **Smart Input** — parser deadline dari teks & foto (`lib/smart-input/extract.ts`)
- **AI Quick Add deadline** dari teks & foto (`app/api/deadlines/ai-extract*`)
- **AI Arena** — breakdown task kompetisi (`app/api/arena/[id]/workspace/ai/route.ts`)
- **Study Plan generator** (`lib/study/plan.ts`)

### Bug tambahan yang ketemu pas nelusurin Arena

- **Nama kolom database salah** (`registration_deadline` vs nama asli
  `deadline_registration`) di 2 file Arena — ini bikin fitur AI Arena
  (tasks/analyze/brief) **selalu gagal total** (404), bukan cuma soal format
  JSON di atas. Sudah diperbaiki.
- **Poin Arena tidak pernah kekirim**: insert `points_events` saat bikin
  postingan Arena pakai client biasa (kena RLS, gagal diam-diam) + kolom
  `metadata` yang sebenarnya tidak ada di skema tabel. Sudah diperbaiki
  (pola yang sama persis dengan fix yang sudah ada di
  `applications/[applicationId]/route.ts` dari sesi sebelumnya — sekarang
  konsisten di kedua tempat).

### Panel Admin — moderasi (baru)

- **Ban / Unban user** + alasan ban, tampil ke user sebagai layar
  "Akun Dinonaktifkan" (`BannedScreen.tsx`) begitu mereka buka dashboard —
  bukan cuma disembunyikan di UI, beneran diblokir di `app/dashboard/layout.tsx`.
- **Ubah plan user manual** — dropdown Radar/Pulse/Command langsung di
  baris tiap user.
- **Hapus Study Room** — tombol hapus (dgn konfirmasi) di tab Study Rooms,
  admin sekarang bisa hapus room siapa pun (sebelumnya cuma read-only).
- **Tombol "Laporkan Akun"** — muncul di halaman profil publik siapa pun
  (`ReportAccountButton.tsx`), user pilih alasan + detail opsional.
- **Tab "Laporan" baru** di panel admin — daftar laporan masuk, bisa
  langsung ban akun yang dilaporkan atau tandai ditinjau/diabaikan.

Endpoint baru: `PATCH /api/admin/users/[id]`, `POST /api/reports`,
`GET/PATCH /api/admin/reports*`. Semua pakai `isAdminEmail()` yang sudah ada
(email admin diatur lewat env `ADMIN_EMAILS` di Vercel).

### NEXA Arena — makin berguna

- **Auto-sync ke Deadline tracker**: begitu bikin postingan ATAU lamaran
  diterima jadi anggota tim, tanggal hari-H/deadline pendaftaran kompetisi
  otomatis masuk ke tracker deadline utama (type "organisasi", prioritas
  tinggi) — jadi nggak perlu catat manual dua kali.
- **Readiness Score** di Team Workspace: indikator kecil (persen + label)
  yang ngegabungin progress checklist tim dan kelengkapan anggota jadi satu
  angka "seberapa siap tim ini" — sengaja dibuat kecil/inline di header,
  bukan panel baru, biar nggak nambah rame.
- Fitur AI breakdown task di workspace (yang sudah ada sebelumnya) sekarang
  beneran berfungsi end-to-end berkat 2 bug fix di atas — hasil AI-nya bisa
  langsung ditambahkan ke checklist tim dengan satu klik (tombol ini sudah
  ada sebelumnya, cuma sebelumnya tidak pernah nyala karena AI-nya gagal
  terus).

### Rekomendasi lanjutan round ini

- Belum sempat audit apakah pola bug "points_events pakai client biasa +
  kolom metadata" ada di file lain di luar yang sudah dicek (activity-feed,
  daily-pulse, ml/risk, account/delete, referrals — semua sudah dicek aman).
- Reports & ban belum ada notifikasi real-time ke admin (misal badge count
  di navbar) — sekarang cuma keliatan kalau buka tab Laporan di panel admin.
- Readiness Score formulanya masih sederhana (65% checklist + 35% jumlah
  anggota) — bisa di-tweak bobotnya kalau dirasa kurang pas setelah dipakai beneran.

---

## Update Round 4 — Batch Badge API & Weekly Challenge reward beneran jalan

### 1. Performance: Batch Badge API (rekomendasi round sebelumnya)

Sebelumnya tiap baris di list panjang (Leaderboard, Arena, daftar teman) yang
nampilin badge = 1 request `/api/badges/[userId]` sendiri-sendiri. List 50
baris = 50 request bersamaan.

**Perbaikan:**
- Endpoint baru `GET /api/badges/batch?ids=id1,id2,...` — 1-2 query database
  buat semua user sekaligus (bukan N query terpisah), max 100 id per request.
- `UnifiedBadgeStrip.tsx` (dipakai semua 20+ komponen badge di app ini lewat
  `PublicUserBadges`, dst — jadi cukup diubah di satu tempat) sekarang punya
  loader batching: semua `userId` yang di-request dalam satu render pass
  dikumpulkan lewat `setTimeout(…, 0)`, lalu ditembak sekali ke endpoint batch.
  Ada cache 60 detik biar remount/scroll ulang nggak fetch ulang.
- Badge diri sendiri ("me", butuh auth cookie) tetap lewat jalur lama
  `/api/badges/me` — bukan kandidat batching publik.
- Tidak ada perubahan di 20+ file pemanggil — semua otomatis dapat manfaatnya
  karena lewat satu komponen yang sama.

### 2. Bug: Reward poin Weekly Challenge cuma teks, nggak pernah beneran dikasih

`WeeklyChallengeCard` sudah lama nampilin reward kayak "+60 poin" dan "+20
poin sosial" di tiap misi mingguan (deadline, teman, dst) — tapi
`/api/weekly-challenge` cuma ngitung progress buat ditampilkan, nggak pernah
manggil `award_points`. Jadi user selesai misi, badge centang muncul, tapi
poin yang dijanjikan di teks itu nggak pernah masuk ke leaderboard mereka.

**Perbaikan:**
- Misi yang punya reward poin (`deadline_3`: +60, `friend_1`: +20) sekarang
  beneran manggil `award_points` lewat RPC yang sudah ada, dengan `ref`
  unik per (user, misi, minggu) — idempoten, aman dipanggil berkali-kali
  tiap kali card di-load (pola yang sama dengan auto-sync badge di
  `/api/badges/me`).
- Misi lain (`pulse_5`, `room_1`, `arena_1`) sengaja TIDAK di-award ulang di
  sini karena rewardnya "Progress ..." — sudah dapat poin dari sistemnya
  masing-masing (streak, study room, arena), biar nggak dobel hitung.
- Bonus baru: kalau SEMUA misi minggu itu selesai, dapat tambahan +50 poin
  sekali per minggu (`weekly_challenge_complete`), muncul di UI card sebagai
  banner hijau "Semua misi minggu ini kelar".
- Card sekarang nampilin total poin yang BENERAN sudah didapat minggu ini
  (`pointsThisWeek`, dari `points_events`), bukan cuma janji di teks misi.

File yang berubah: `app/api/badges/batch/route.ts` (baru),
`components/badges/UnifiedBadgeStrip.tsx`, `app/api/weekly-challenge/route.ts`,
`components/dashboard/WeeklyChallengeCard.tsx`.

**Nggak perlu migration baru** — keduanya pakai tabel & RPC (`points_events`,
`award_points`, `nexa_user_badges`) yang sudah ada.

### Rekomendasi lanjutan round ini

- Kalau mau audit N+1 lain di luar badge (misal fetch profil per baris di
  list yang sama), pola batching yang sama bisa direplikasi.
- Reward Weekly Challenge sekarang fixed (+60/+20/+50) — kalau mau di-tweak
  jadi progresif tiap minggu berturut-turut (kayak streak bonus), itu langkah
  natural berikutnya buat retention jangka panjang.

---

## Update Round 5 — Streak Milestone Celebration

### Fitur baru: perayaan visual saat streak Daily Pulse capai milestone

Sebelumnya streak di `DailyPulseCard` cuma ditampilin sebagai angka polos —
nggak ada validasi visual pas user capai titik penting (padahal ini salah
satu driver retention paling murah: orang lebih semangat jaga streak kalau
progress-nya dirayakan, bukan cuma dihitung).

**Perbaikan:**
- Titik milestone: 3, 7, 14, 30, 60, 100 hari beruntun.
- Pas kena tepat di angka milestone: kartu "Streak" dapat highlight (border +
  background oranye, ikon api animasi pulse), plus banner kecil di bawah grid
  "Ritme 7 hari" — copy `"Streak N hari! Konsistensi kayak gini yang bikin
  beda dibanding kebut semalam."`
- Di hari biasa (belum kena milestone): banner tetap tampil versi netral,
  nunjukin progress ke milestone berikutnya, misal `"3 hari lagi ke
  milestone 7 hari."` — biar selalu ada target kecil yang kelihatan, bukan
  cuma pas momen spesial.
- Streak 0 (belum mulai / kena putus) sengaja tidak menampilkan banner.
- Murni perubahan frontend — `currentStreak` sudah dihitung di
  `/api/daily-pulse` sebelumnya, cuma pemakaiannya di UI yang ditambah. Nggak
  ada perubahan API atau migration.

File yang berubah: `components/dashboard/DailyPulseCard.tsx`.

### Rekomendasi lanjutan round ini

- Kalau mau lebih jauh, milestone gede (30/60/100 hari) bisa dikaitkan ke
  badge/poin bonus juga (pola yang sama seperti fix Weekly Challenge di round
  4) — sekarang murni visual, belum ada reward tambahan.
- Confetti/animasi lebih besar pas hit milestone besar bisa nambah "wah
  factor", tapi butuh dependency animasi baru — sengaja tidak ditambahkan di
  sini biar tetap ringan tanpa install package baru.

---

## Update Round 6 — Quick wins: tooltip badge & skeleton leaderboard yang kelupaan dipasang

### 1. Tooltip badge sekarang kasih deskripsi & cara unlock, bukan cuma nama

Hover ke badge kecil (di leaderboard, arena, daftar teman, dll — lewat
`UnifiedBadgeStrip`) sebelumnya cuma nampilin `"Nama Badge · rarity"`. Data
`description` dan `requirement` sudah ada di catalog buat semua badge
(dipakai di halaman Pencapaian), tapi nggak ikut ditampilkan di versi kecil
ini.

**Perbaikan:** tooltip (`title` attribute) sekarang isinya nama, rarity,
deskripsi, dan cara unlock — jadi badge di list mana pun tetap informatif
walau usernya nggak buka halaman Pencapaian. Diterapkan di
`UnifiedBadgeStrip.tsx` dan versi compact `NexaBadgeCard.tsx` (versi
non-compact-nya sudah nampilin ini di body card, jadi nggak perlu diubah).

*(Sempat dicek `InlineBadge.tsx`/`ArenaPostCard.tsx` — ternyata cuma dipakai
di `ArenaListExample.tsx`, contoh kode yang tidak pernah di-import halaman
manapun. Dead code, tidak disentuh.)*

### 2. Bug: Skeleton loader leaderboard sudah dibikin, tapi kelupaan dipasang

`components/ui/SkeletonCard.tsx` ternyata sudah punya `SkeletonPodium` dan
`SkeletonLeaderboardEntry` — dibuat khusus buat halaman Leaderboard, lengkap
bentuknya (podium 3 + baris ranking). Tapi `LeaderboardView.tsx` nggak
pernah pakai keduanya — loading state-nya cuma spinner polos di tengah
layar kosong.

**Perbaikan:** loading state Leaderboard sekarang render `SkeletonPodium` +
6× `SkeletonLeaderboardEntry`, jadi bentuknya mirip konten asli yang bakal
muncul (mengurangi "layout shift" pas data selesai load, dan kelihatan lebih
cepat/hidup dibanding spinner kosong).

File yang berubah: `components/badges/UnifiedBadgeStrip.tsx`,
`components/badges/NexaBadgeCard.tsx`, `components/dashboard/LeaderboardView.tsx`.

**Nggak ada migration** — semua perubahan UI/komponen murni.

### Rekomendasi lanjutan round ini

- `ArenaView.tsx` masih pakai spinner polos juga saat loading (nggak ada
  skeleton khusus Arena dibikin) — kalau mau konsisten, bisa ditambah
  `SkeletonAchievementCard`-style baru buat Arena, sengaja belum dikerjakan
  di round ini biar scope tetap kecil & aman.

---

## Update Round 7 — Notifikasi HP asli (Web Push), Telegram tutorial, auto-hapus deadline lewat

### 1. Bug besar: notifikasi HP (Web Push) sudah lengkap infra-nya, tapi TIDAK PERNAH dipakai

Ditemukan Web Push sudah dibangun cukup lengkap — service worker
`public/push-sw.js`, util `lib/push/web-push.ts`, route
`/api/push/{subscribe,unsubscribe,test}`, bahkan komponen UI-nya
`components/settings/PushNotificationSettings.tsx` — tapi ada 3 masalah yang
bikin fitur ini nggak pernah benar-benar jalan:

- **Komponennya nggak pernah dipasang di halaman manapun.** `<PushNotificationSettings />`
  itu dead code — nggak ada satupun page yang import & render dia, jadi user
  nggak akan pernah lihat tombol "Aktifkan Notifikasi HP" ini.
- **Cron reminder (`/api/cron/send-reminders`) cuma kirim Telegram.** Semua
  infra push di atas nganggur — nggak ada satupun kode yang benar-benar
  manggil `sendWebPush()` waktu deadline reminder due. Jadi walaupun user
  sempat subscribe manual, nggak akan pernah dapat notifikasi beneran.
- **Tabel `push_subscriptions` nggak ada di migration manapun.** Route
  subscribe/unsubscribe/test semua query ke tabel ini, tapi kalau database
  di-setup dari `schema.sql` + `migrations/`, tabelnya nggak pernah kebuat →
  subscribe pasti gagal di database baru.
- **Bonus bug:** `reminder_preferences` cuma unique per `user_id` (bukan per
  `user_id + channel`), padahal `push/subscribe/route.ts` upsert pakai
  `onConflict: 'user_id,channel'` — jadi baris preferensi channel `push`
  bakal bentrok/nimpa baris `telegram` punya user yang sama. Constraint
  `channel` juga belum mengizinkan nilai `'push'` sama sekali (di
  `reminder_preferences` maupun `reminder_logs`).

**Perbaikan:**
- Migration baru `supabase/migrations/20260808_push_channel_and_autodelete.sql`:
  bikin tabel `push_subscriptions` (+ RLS), ganti unique constraint
  `reminder_preferences` jadi `(user_id, channel)`, izinkan channel `'push'`
  di `reminder_preferences` dan `reminder_logs`.
- `<PushNotificationSettings />` sekarang dipasang di halaman
  `/dashboard/settings/reminders`.
- `src/app/api/cron/send-reminders/route.ts` di-restructure: untuk setiap
  window (H-7/H-3/H-1/hari-H), sekarang cek DUA channel — Telegram (seperti
  sebelumnya) DAN Web Push (baru) — masing-masing dengan dedup sendiri lewat
  `reminder_logs`, dan subscription yang sudah expired (404/410 dari
  provider) otomatis dihapus dari `push_subscriptions`. Notifikasi in-app
  (bell) tetap cuma masuk sekali per deadline+window walau dua channel
  berhasil, biar nggak dobel.

### 2. Notifikasi push dibikin lebih "kerasa" — gaya notifikasi HP asli

`public/push-sw.js` sebelumnya cuma nampilin title/body polos. Sekarang:
- Icon besar + badge status-bar pakai logo NEXA (`icon-192.png`), supaya
  langsung kekenali walau notifikasi ke-grouped dengan app lain (mirip
  notifikasi WA/Telegram di panel notifikasi Android pada screenshot
  referensi).
- Getar (`vibrate`) — pola lebih tegas khusus buat reminder hari-H
  (`requireInteraction: true` juga, jadi nggak ilang sendiri sebelum
  disentuh).
- Tombol aksi langsung di notifikasi: **Buka** & **Tutup**.
- `renotify: true` supaya notifikasi baru dengan tag sama tetap membangunkan
  device, bukan cuma diam-diam update notifikasi lama.

File yang berubah: `public/push-sw.js`, `src/lib/reminders/push-message.ts`
(tambah field `urgent`/`timestamp`), `src/lib/push/web-push.ts` (update tipe
`PushPayload`).

### 3. Tutorial setup Telegram langsung di halaman Settings

Sebelumnya user cuma dikasih 1 kalimat "Chat ID bisa didapat dari bot..."
tanpa langkah jelas. `ReminderSettingsForm.tsx` sekarang punya panduan
5 langkah bernomor (buka bot → /start → bot balas Chat ID → tempel ke form
→ simpan & test), plus tombol **"Buka Bot Telegram"** yang deep-link
langsung ke `https://t.me/<username>` kalau env `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
diisi (opsional — kalau kosong, tutorial tetap tampil tanpa tombol
deep-link, fallback ke instruksi cari manual + `@userinfobot`).

### 4. Fitur baru: auto-hapus deadline yang tanggalnya sudah lewat

Opsional, **default OFF**, diatur user sendiri di Settings → Reminder:

- 2 kolom baru di `profiles`: `auto_delete_expired_deadlines` (boolean) dan
  `auto_delete_expired_after_days` (0–60 hari, default 7).
- Komponen baru `components/settings/DeadlineAutoDeleteSettings.tsx` — toggle
  on/off + pilihan "hapus setelah berapa hari lewat" (langsung / 3 / 7 / 14 /
  30 hari), lengkap warning bahwa penghapusan permanen.
- Route cron baru `src/app/api/cron/cleanup-expired-deadlines/route.ts` —
  jalan sekali sehari (lihat `supabase/UPDATE_NOTES.md` untuk cara daftarkan
  jadwalnya), hapus `academic_deadlines` yang `deadline_date` sudah lewat
  dari cutoff pilihan tiap user, HANYA untuk user yang mengaktifkan opsi ini.

**Sengaja tidak auto-aktif untuk siapapun** — supaya nggak ada yang tiba-tiba
kehilangan riwayat deadline lamanya tanpa consent.

### File yang berubah/baru — ringkasan

- Baru: `supabase/migrations/20260808_push_channel_and_autodelete.sql`
- Baru: `src/app/api/cron/cleanup-expired-deadlines/route.ts`
- Baru: `src/components/settings/DeadlineAutoDeleteSettings.tsx`
- Ubah: `src/app/api/cron/send-reminders/route.ts`
- Ubah: `public/push-sw.js`
- Ubah: `src/lib/reminders/push-message.ts`
- Ubah: `src/lib/push/web-push.ts`
- Ubah: `src/components/ReminderSettingsForm.tsx`
- Ubah: `src/app/dashboard/settings/reminders/page.tsx`
- Ubah: `src/types/index.ts` (`ReminderChannel` tambah `'push'`, `Profile`
  tambah 2 kolom auto-delete)

### Rekomendasi lanjutan round ini

- Belum ada UI buat atur H-7/H-3/H-1/hari-H khusus untuk channel push secara
  terpisah dari Telegram (saat ini push ikut default kolom, yaitu H-1 &
  hari-H aktif). Kalau mau dipisah, tinggal duplikasi pola
  `ReminderSettingsForm.tsx` dengan `channel: 'push'`.
- iOS Safari: Web Push baru jalan setelah user "Add to Home Screen" (sudah
  ada catatannya di UI `PushNotificationSettings.tsx`, iOS 16.4+).

---

## Update Round 7 (lanjutan) — Jadwal notifikasi push bisa diatur terpisah dari Telegram

Rekomendasi lanjutan di Round 7 sudah dikerjakan: `PushNotificationSettings.tsx`
sekarang punya bagian "Kapan notifikasi HP dikirim?" sendiri (checkbox
H-7/H-3/H-1/hari-H + jam kirim), disimpan ke `reminder_preferences` dengan
`channel: 'push'` — terpisah dari jadwal Telegram. Muncul begitu device sudah
subscribe push. Halaman `/dashboard/settings/reminders` di-update untuk fetch
preferensi channel `push` di server dan teruskan sebagai `initialPreferences`
ke komponennya.

File yang berubah: `src/components/settings/PushNotificationSettings.tsx`,
`src/app/dashboard/settings/reminders/page.tsx`.

---

## Update Round 8 — WhatsApp reminder (Wablas) + tombol hapus notifikasi

### 1. Channel reminder baru: WhatsApp lewat Wablas

Landing page & marketing copy project ini sendiri sudah janji "Telegram dulu,
Wablas nanti" — sekarang direalisasikan. WhatsApp sekarang jadi channel
reminder ketiga (setelah Telegram & Push), dikirim lewat **Wablas** (WhatsApp
API gateway pihak ketiga, bukan Meta resmi — device-nya scan QR pakai nomor
WA khusus milik akun Wablas, BUKAN nomor pribadi mahasiswa).

**File baru:**
- `src/lib/whatsapp.ts` — `sendWhatsAppMessage()`, `waConfigured()`,
  `normalizeIndonesianPhone()` (terima input `08xxx`/`+62xxx`/`62xxx`/`8xxx`),
  plus `buildWhatsAppReminderMessage()` & `buildWhatsAppTestMessage()` —
  format WhatsApp pakai `*bold*`/`_italic_`, BUKAN tag HTML seperti Telegram,
  karena WhatsApp nggak support HTML.
- `src/app/api/reminders/whatsapp/test/route.ts` — kirim pesan tes, mirror
  pola `api/reminders/telegram/test`.
- `src/components/settings/WhatsAppReminderSettings.tsx` — kartu Settings
  baru: nomor WhatsApp, toggle H-7/H-3/H-1/hari-H, jam kirim, tombol simpan +
  tombol tes. Nonaktif otomatis (dengan badge peringatan) kalau
  `WABLAS_API_URL`/`WABLAS_TOKEN` belum diisi di server.

**File yang diubah:**
- `src/app/api/cron/send-reminders/route.ts` — WhatsApp jadi channel ketiga
  di loop reminder, dengan dedup sendiri lewat `reminder_logs` (channel
  `'whatsapp'` — nilai ini sudah diizinkan dari awal di schema, jadi TIDAK
  perlu migration baru untuk ini khususnya).
- `src/components/ReminderSettingsForm.tsx` — field nomor WhatsApp yang
  lama (yang cuma nyimpen ke `profiles.whatsapp_number` tanpa efek apa-apa)
  DIHAPUS dari sini, dipindah sepenuhnya ke `WhatsAppReminderSettings.tsx`
  yang beneran fungsional. Copy "WhatsApp belum aktif..." dihapus.
- `src/components/OnboardingForm.tsx`, `src/components/FirstTimeOnboarding.tsx`
  — copy "coming soon" untuk WhatsApp diupdate supaya nggak kontradiksi
  sama fitur yang sekarang beneran jalan.
- `src/app/dashboard/settings/reminders/page.tsx` — fetch preferensi channel
  `whatsapp`, render `<WhatsAppReminderSettings />`.

**Env variable baru (wajib diisi supaya WhatsApp aktif):**
```
WABLAS_API_URL=https://<namaserver-akun-kamu>.wablas.com/api/send-message
WABLAS_TOKEN=<token dari dashboard Wablas>
```

**Catatan jujur soal keterbatasan:** karena Claude tidak bisa akses dashboard
Wablas kamu langsung, format response sukses/gagal API-nya (field JSON
persisnya) didekati secara defensif berdasarkan dokumentasi publik & contoh
komunitas, BUKAN diverifikasi langsung ke akun kamu. **Wajib coba "Kirim Test
WhatsApp" dulu setelah isi env**, dan kalau ternyata response Wablas versi
akunmu beda, cek pesan error yang muncul (ada di `reminder_logs.provider_message`
juga) lalu kabari supaya penyesuaiannya presisi.

**Rekomendasi lanjutan (belum dikerjakan):** copy marketing di `src/app/page.tsx`
(badge "WhatsApp menyusul", FAQ), `src/app/terms/page.tsx`,
`src/app/privacy/page.tsx`, dan `src/components/LoginClient.tsx` ("Telegram
dulu, Wablas nanti.") masih menyiratkan WhatsApp belum aktif — sengaja TIDAK
diubah di round ini karena itu teks marketing/legal yang sebaiknya direview
manusia dulu sebelum diedit, apalagi bagian privacy policy (perlu
disclosure baru: nomor WhatsApp dikirim ke Wablas sebagai pihak ketiga).

### 2. Notifikasi bell: tombol hapus (satu & semua)

`notifications` (bell icon + halaman `/dashboard/notifications`) sebelumnya
cuma bisa ditandai dibaca — nggak bisa dihapus sama sekali dari UI.

- `src/app/api/notifications/route.ts` — tambah handler `DELETE`: hapus satu
  (`{ id }`), banyak sekaligus (`{ ids: [...] }`), atau semua (`{ all: true }`),
  semuanya scoped ke `user_id` milik sendiri.
- `src/components/NotificationBell.tsx` — ikon tempat sampah di tiap item +
  tombol "Hapus semua" di header dropdown (di samping "Tandai semua"),
  dengan `window.confirm()` sebelum hapus semua.
- `src/components/dashboard/NotificationCenterView.tsx` — tombol "Hapus
  semua" di header + ikon hapus per item, pola yang sama.

Tidak perlu migration — kolom yang dipakai sudah ada semua, cuma nambah
endpoint DELETE yang sebelumnya nggak ada.

### File yang berubah/baru — ringkasan Round 8

- Baru: `src/lib/whatsapp.ts`
- Baru: `src/app/api/reminders/whatsapp/test/route.ts`
- Baru: `src/components/settings/WhatsAppReminderSettings.tsx`
- Ubah: `src/app/api/cron/send-reminders/route.ts`
- Ubah: `src/components/ReminderSettingsForm.tsx`
- Ubah: `src/components/OnboardingForm.tsx`
- Ubah: `src/components/FirstTimeOnboarding.tsx`
- Ubah: `src/app/dashboard/settings/reminders/page.tsx`
- Ubah: `src/app/api/notifications/route.ts`
- Ubah: `src/components/NotificationBell.tsx`
- Ubah: `src/components/dashboard/NotificationCenterView.tsx`

---

## Update Round 9 — Fix build error + notifikasi popup in-app (real-time)

### 1. Fix build gagal di Vercel: unescaped quotes

Build log dari Vercel nunjukin `next build` gagal total (bukan cuma warning)
gara-gara ESLint rule `react/no-unescaped-entities` di
`DeadlineAutoDeleteSettings.tsx` baris 141 — ada tanda kutip lurus (`"selesai"`)
langsung di teks JSX. Diganti ke entity `&quot;selesai&quot;`. Sudah diaudit
ulang semua file yang disentuh di round-round sebelumnya untuk pola yang
sama — cuma ada 1 file lain yang punya tanda kutip literal di teks JSX
(`PushNotificationSettings.tsx`), tapi file itu sudah punya
`/* eslint-disable react/no-unescaped-entities */` dari awal jadi aman.

**Catatan:** warning-warning lain di log (`no-img-element`,
`react-hooks/exhaustive-deps` di `AskNexaPanel.tsx`, `FocusMode.tsx`, dst)
itu WARNING bukan ERROR — tidak menggagalkan build, jadi tidak disentuh di
round ini (bukan bagian dari kode yang aku tulis, dan tidak menghalangi
deploy).

### 2. Fitur baru: notifikasi popup in-app (real-time, bukan cuma bell icon)

Sebelumnya, notifikasi baru (reminder deadline, chat, dst) di tabel
`notifications` cuma bikin badge angka di bell icon nambah — user harus
sadar & klik bell buat lihat isinya. Sekarang ada **popup toast** yang
muncul otomatis begitu notifikasi baru masuk, selama user lagi buka app-nya
(pelengkap Web Push yang jalan pas app ketutup).

**File baru:**
- `src/lib/notifications/type-meta.ts` — satu sumber kebenaran buat
  ikon/warna per jenis notifikasi (`deadline_reminder`, `direct_message`,
  `achievement`, dst), dipakai bareng oleh bell, notification center, DAN
  popup baru ini. Sebelumnya ada 3 mapping ikon terpisah & saling beda
  (`NotificationBell.tsx` vs `NotificationCenterView.tsx` bahkan sempat
  ketuker emoji-nya antara `deadline_reminder` dan `deadline_approaching` —
  sekalian dirapikan).
- `src/components/NotificationPopup.tsx` — komponen popup-nya. Detail
  desain (biar berasa "kayak brand besar" & gampang dipakai di HP):
  - **Mobile-first**: full-width (minus margin) nempel di atas layar,
    posisi ngikutin `env(safe-area-inset-top)` biar nggak ketiban notch/status
    bar. Di layar lebar (`sm:` ke atas) otomatis pindah jadi kartu kecil di
    pojok kanan-atas, gaya umum toast desktop (Vercel/Linear/dsb).
  - **Swipe-to-dismiss**: geser kartu ke kiri/kanan buat nutup, kayak
    notifikasi bawaan Android/iOS — bukan cuma tombol X.
  - **Auto-dismiss 7 detik** dengan progress bar tipis di bawah kartu yang
    mengecil real-time, jadi user tahu berapa lama lagi sebelum hilang.
  - **Maksimal 3 kartu** kelihatan sekaligus — kalau notifikasi numpuk,
    yang lama otomatis "didorong" keluar dari tampilan (tapi tetap ada &
    aman di bell/notification center, cuma nggak numpuk di popup).
  - Ketuk kartu → buka link terkait & tandai dibaca. Getar halus
    (`navigator.vibrate`) di device yang support, dibungkus try/catch biar
    aman di device yang nggak support.
  - Animasi masuk/keluar pakai CSS murni (`@keyframes nexa-toast-in` di
    `globals.css`) — TIDAK nambah dependency npm baru sama sekali.
- Keyframes baru `nexa-toast-in`/`.nexa-toast-out` di `src/app/globals.css`.

**File yang diubah:**
- `src/app/dashboard/layout.tsx` — mount `<NotificationPopup />` sekali,
  global, di samping `<DashboardSuccessToast />` yang sudah ada.
- `src/components/NotificationBell.tsx` — pakai `typeIcon` dari
  `type-meta.ts` (hapus mapping ikon lokal yang duplikat), DAN fix bug
  realtime subscription yang sebelumnya dengerin insert notifikasi
  **SEMUA user** (bukan cuma milik sendiri) — jadi browser tiap user
  refetch tiap kali ADA SIAPAPUN dapat notifikasi, bukan cuma pas dirinya
  sendiri. Sekarang di-filter `user_id=eq.<id>` dan juga dengerin
  UPDATE/DELETE (`event: '*'`) biar badge count ikut sinkron kalau
  ditandai/dihapus dari tab/device lain.
- `src/components/dashboard/NotificationCenterView.tsx` — pakai `typeIcon`
  yang sama, hapus mapping lokal ketiga yang tadinya beda sendiri.

**Kenapa nggak pakai library toast (sonner/react-hot-toast)?** Karena
`package.json` sengaja nggak ikut di-export ke Claude (lihat catatan di
awal file ini), jadi nggak ada cara aman buat nambah dependency baru tanpa
tahu persis apa yang udah ada. Dibikin dari CSS + React state murni supaya
langsung jalan tanpa `npm install` tambahan apapun.

### File yang berubah/baru — ringkasan Round 9

- Baru: `src/lib/notifications/type-meta.ts`
- Baru: `src/components/NotificationPopup.tsx`
- Ubah: `src/app/globals.css`
- Ubah: `src/app/dashboard/layout.tsx`
- Ubah: `src/components/NotificationBell.tsx`
- Ubah: `src/components/dashboard/NotificationCenterView.tsx`
- Ubah: `src/components/settings/DeadlineAutoDeleteSettings.tsx` (fix build)

---

## Update Round 10 — Fix visual glitch, modal ketutup nav, gesture tarik notifikasi, insight belajar dari histori

### 1. Fix "garis garis" (foto 1 & 2): root cause-nya `filter: blur()` di konten asli

Ternyata dua foto itu penyebabnya SAMA: `CommandFocusPlan.tsx` (kotak biru
tua "Command Focus Plan belum aktif" di foto 2) pakai `blur-[2px]` langsung
di atas konten asli yang punya radial-gradient background + teks kompleks.
`filter: blur()` di atas layer bergradient kayak gini adalah bug rendering
GPU yang cukup dikenal di Android Chrome/WebView — hasilnya bukan blur
halus, tapi noise/garis-garis kayak yang kelihatan di foto. Karena
`CommandFocusPlan` ada di halaman dashboard yang sama dengan
`DashboardStatsStrip`/`WeeklyReviewCard` (foto 1), kemungkinan besar
corrupted paint frame-nya "bocor" ke area sekitar saat scroll di compositor
Android — makanya foto 1 juga kena walau komponennya sendiri nggak ada
blur.

**Fix:** ganti `blur-[2px]` jadi `opacity-30` di dua tempat yang pakai pola
ini (`CommandFocusPlan.tsx` dan `AIQuickAddDeadline.tsx`, sama-sama dipakai
buat "ngintip tapi ngeblur" konten premium yang dikunci). `opacity` jauh
lebih murah buat GPU dan nggak punya masalah rendering ini — efek visualnya
mirip (konten asli tetap keliatan samar-samar di belakang overlay lock),
cuma lebih aman lintas device.

**Catatan jujur:** aku nggak bisa render halaman ini beneran buat verifikasi
visual, jadi analisisnya berdasarkan pembacaan kode + pengetahuan soal bug
kelas ini. Tolong dicek lagi setelah deploy — kalau garis-garisnya masih
muncul di tempat lain, kirim screenshot baru + kasih tau device/browser apa
yang dipakai motretnya.

### 2. Fix tombol "Kirim Laporan" ketutup bottom nav (foto 3)

`ReportAccountButton.tsx` (modal "Laporkan akun ini") pakai `z-50` — SAMA
persis dengan z-index `MobileBottomNav` (`fixed bottom-0 z-50`). Kalau dua
elemen z-index-nya sama, urutan DOM yang menang, dan karena bottom nav
dipasang belakangan di `AppShell`, dia nutupin modal di area bawah layar —
persis kayak di foto, tombol submit ketutup. Semua modal lain di app ini
sudah pakai konvensi `z-[70]` (di atas nav), cuma file ini yang ketinggalan.

**Fix:**
- `ReportAccountButton.tsx`: z-index dinaikin ke `z-[70]`, plus ditambah
  `max-h-[85vh] overflow-y-auto` + padding bawah yang ngikutin
  `env(safe-area-inset-bottom)`, jadi walau daftar alasan laporan panjang,
  tombol submit tetap ke-scroll dan kejangkau.
- Sekalian disisir 2 modal lain yang ternyata punya bug z-index yang sama
  (`ShareDeadlineModal.tsx`, `FirstTimeOnboarding.tsx`) — dinaikin ke
  `z-[70]` juga biar konsisten & nggak ketimpa nav di device manapun.

### 3. Copy: hapus "lu" (jangan pake "lu"/"kamu", tetap gen z)

5 file yang pakai kata "lu" secara langsung sudah diganti — tetap santai/gen
z, cuma nggak nyapa langsung pake "lu" lagi (pakai imbuhan "-nya" atau restrukturisasi kalimat):
`WeeklyReviewCard.tsx` ("Minggu lu..." → "Minggu ini..." — ini yang
kelihatan di foto 1), `ManualPaymentCard.tsx`, `PlanScopeMatrix.tsx`,
`StudyRoomCommandActions.tsx`, `FlashcardView.tsx`.

**PENTING — soal kata "kamu":** kata ini kepake di **54 file** lain di
seluruh app (ratusan kalimat), jauh lebih besar dari yang kelihatan di 3
screenshot kamu (nggak ada satupun kata "kamu" yang kelihatan di foto 1-3).
Ganti semuanya sekaligus tanpa baca satu-satu risikonya kalimat jadi
janggal/rusak grammar-nya di banyak tempat. **Sengaja belum disentuh di
round ini** — tunggu konfirmasi kamu dulu: mau langsung disapu semua 54
file (bakal makan waktu & beberapa pesan lagi), atau cuma di halaman-halaman
utama dulu (dashboard, onboarding, notifikasi)?

### 4. Fitur baru: tarik ke bawah dari atas layar buat buka notifikasi

`src/components/PullToRevealNotifications.tsx` — gesture "tarik status bar
ke bawah" kayak buka notification shade HP asli. Aktif cuma pas halaman
lagi di posisi paling atas (`scrollY` 0), jadi nggak ganggu scroll biasa:
- Tarik dikit → muncul indikator panah kecil dengan resistance/redaman
  (nggak langsung full, ngikutin jarak tarikan, kayak native pull gesture).
- Lewat ambang batas & lepas → panel notifikasi kebuka penuh dari atas,
  nampilin sampai 8 notifikasi terbaru (ikon, judul, pesan, waktu), bisa
  hapus per-item, ada link "Lihat semua notifikasi".
- Tarik ke atas lagi di panel yang udah kebuka → nutup (swipe-up-to-close).
- Pakai endpoint `/api/notifications` yang sudah ada — nggak ada API baru.
- Mount global di `src/app/dashboard/layout.tsx`, jalan di semua halaman
  dashboard.

### 5. Fitur baru: "NEXA belajar dari histori kamu" (insight, bukan AI beneran)

Diminta "webnya belajar dari aktivitas user makin pinter" — supaya jujur
dan nggak janji lebih dari yang beneran dikerjain, ini DIBANGUN SEBAGAI
agregasi statistik dari histori deadline yang sudah user selesaikan sendiri
(BUKAN model machine learning) — ditulis apa adanya di UI-nya juga ("bukan
AI beneran" ada di komentar kode, dan copy-nya nggak pernah klaim "AI").

- `src/app/api/insights/activity-pattern/route.ts` — hitung dari 8 minggu
  terakhir: jam berapa user paling sering nyelesain deadline, hari apa
  paling produktif, dan tren completion rate (4 minggu terakhir vs 4 minggu
  sebelumnya). Kalau data belum cukup (< 5 deadline selesai), kartu nunjukin
  progress bar "X/5" — nggak maksa kasih saran dari data yang belum
  representatif.
- `src/components/dashboard/ActivityLearningCard.tsx` — nampilin insight
  itu + 1 saran konkret (jam reminder yang disaranin = 2 jam sebelum jam
  biasa user gerak), dengan tombol "Pakai jam ini" yang langsung update
  `reminder_preferences.reminder_time` di semua channel yang sudah pernah
  disetup user (telegram/push/whatsapp) — jadi beneran actionable, bukan
  cuma statistik doang.
- Dipasang di `src/app/dashboard/page.tsx`, setelah Weekly Review.

### File yang berubah/baru — ringkasan Round 10

- Baru: `src/components/PullToRevealNotifications.tsx`
- Baru: `src/app/api/insights/activity-pattern/route.ts`
- Baru: `src/components/dashboard/ActivityLearningCard.tsx`
- Ubah: `src/components/dashboard/CommandFocusPlan.tsx` (fix blur bug)
- Ubah: `src/components/ai/AIQuickAddDeadline.tsx` (fix blur bug)
- Ubah: `src/components/profile/ReportAccountButton.tsx` (fix z-index + scroll)
- Ubah: `src/components/dashboard/ShareDeadlineModal.tsx` (z-index konsistensi)
- Ubah: `src/components/FirstTimeOnboarding.tsx` (z-index konsistensi)
- Ubah: `src/components/billing/ManualPaymentCard.tsx`, `PlanScopeMatrix.tsx`,
  `src/components/dashboard/WeeklyReviewCard.tsx`,
  `src/components/study-room/StudyRoomCommandActions.tsx`,
  `src/components/study/FlashcardView.tsx` (hapus "lu")
- Ubah: `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx` (mount widget baru)
