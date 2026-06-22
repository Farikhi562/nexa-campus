# NEXA Campus — Batch 20: Arena AI + Study Room AI

## Validasi
- `tsc --noEmit` standar: 0 error
- `tsc --noEmit` target ES5 tanpa downlevelIteration (strict probe): 0 error
  — ditemukan bug `[...new Set(...)]` yang sama dengan late-risk-model.ts, langsung difix
- `next build` ESLint aktif: 0 error, 0 warning baru
- 152 test assertion dari sesi sebelumnya: semua tetap lulus, zero regresi

## Cara Pasang
1. Timpa 7 file (lihat daftar di bawah)
2. `npm run build` — sudah divalidasi hijau

---

## NEXA Study Room — AI Tutor

Tombol "AI Tutor" muncul di atas input bar di SETIAP Study Room.
Semua member bisa pakai. Rate limit: 15 call/jam per user.

### 3 Aksi

| Aksi | Apa yang dilakukan |
|---|---|
| **Rangkum Diskusi** | Baca 80 pesan terakhir → buat ringkasan poin penting + follow-up + action items |
| **Tanya AI** | Q&A bebas dalam konteks materi + goal grup + diskusi terbaru |
| **Buat Rencana** | Generate rencana belajar 1-2 minggu berdasarkan group_goal, material_link, dan diskusi |

Konteks yang dipakai AI per request:
- Workspace: `group_goal`, `pinned_note`, `material_link`, `next_session_at`
- Pesan: 80-100 pesan teks terakhir + nama sender masing-masing
- Room: nama room + subject/matkul

### File baru
- `src/app/api/study-rooms/[id]/ai/route.ts` — POST endpoint, 3 action
- `src/components/study-room/StudyRoomAIPanel.tsx` — UI panel collapsible

### File diupdate
- `src/components/dashboard/StudyRoomDetail.tsx` — import + render StudyRoomAIPanel di atas input bar

---

## NEXA Arena — AI di 3 Titik

### 1. Generate Brief Saat Buat Posting (ArenaView form)
Tombol **"AI Bantu Tulis"** muncul di samping label Deskripsi.
Klik → AI baca judul, nama kompetisi, tipe, skill, ukuran tim → tulis deskripsi lengkap otomatis.
User bisa edit setelah AI generate. Hanya aktif kalau judul sudah diisi.

**API baru**: `POST /api/arena/brief-preview` (tanpa post ID, pakai data form langsung)

### 2. Generate Task AI di Workspace (ArenaTeamWorkspaceView)
Tombol **"Generate Task AI"** di header checklist.
AI baca detail kompetisi (judul, deskripsi, skill, deadline, task yang sudah ada) → generate 15 task konkret yang belum ada.
Preview task dulu → creator bisa klik "Tambah ke checklist" untuk apply.
Tersedia untuk semua anggota tim.

### 3. Analisis Kekuatan Tim (ArenaTeamWorkspaceView)
Card baru **"Analisis Kekuatan Tim"**. Klik → AI baca skill profil tiap anggota vs skill yang dibutuhkan lomba.
Output: kekuatan tim, gap skill, rekomendasi pembagian peran, saran persiapan.
Jujur — kalau ada gap serius, AI akan bilang.

### 4. Improve Brief Posting (ArenaTeamWorkspaceView)
Card baru **"Improve Brief Posting"** (creator only).
AI baca data lomba yang sudah tersimpan → tulis ulang deskripsi yang lebih menarik.
Output bisa di-copy langsung lalu paste ke edit posting.

**API baru**: `POST /api/arena/[id]/workspace/ai` — action: `tasks` | `analyze` | `brief`

### File baru
- `src/app/api/arena/[id]/workspace/ai/route.ts` — 3 action endpoint
- `src/app/api/arena/brief-preview/route.ts` — generate brief tanpa post ID (untuk form create)

### File diupdate
- `src/components/dashboard/ArenaTeamWorkspaceView.tsx` — AI state + buttons + result panels
- `src/components/dashboard/ArenaView.tsx` — tombol AI Brief di form create/edit

---

## Desain Penting

**Tidak gated plan** — Arena dan Study Room AI tersedia untuk semua user yang punya akses ke fitur tersebut (member room / member tim). AI yang lebih berat (Study Pack flashcard, deep-dive) sudah gated di batch sebelumnya.

**Rate limiting** — 15/jam Study Room, 10/jam Arena workspace AI, 15/jam brief preview — konsisten dengan pola batch sebelumnya.

**Tidak simpan hasil AI ke DB** — hasil ditampilkan inline, user yang memutuskan mau apply atau tidak (task checklist) / copy paste (brief). Tidak ada state server untuk hasil AI.

**Strict TS fix** — `[...new Set(arr)]` diganti `Array.from(new Set(arr))` karena downlevelIteration bug yang sama yang sudah ditemukan di batch sebelumnya.
