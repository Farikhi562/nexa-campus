# NEXA Campus — Fitur Baru (Batch 4)

## ✅ 3. NEXA Arena — Leaderboard Tim & Badge Kompetisi

**Langkah 1 — DB:** jalankan `docs/MIGRATION_arena_leaderboard_badges.sql` di Supabase → SQL Editor.
Membuat:
- `nexa_arena_results` — creator mencatat hasil lomba timnya (juara_1/2/3, finalist, participant).
- View `nexa_arena_team_leaderboard` — ranking tim = bobot placement + total poin anggota (pakai `points_events` yang sudah ada).
- View `nexa_arena_user_badges` — badge kompetisi per user dari placement tim yang diikuti.
- RLS: hasil hanya bisa ditulis oleh creator post; leaderboard bisa dibaca semua user login.

**Langkah 2 — API (drop-in):**
- `src/app/api/arena/leaderboard/route.ts` — `GET /api/arena/leaderboard?type=&limit=` → daftar tim + badge milikmu.
- `src/app/api/arena/[id]/result/route.ts` — `POST` (creator) catat placement timnya.

**Langkah 3 — UI:**
- `src/components/arena/ArenaLeaderboard.tsx` — leaderboard tim + filter kategori + badge kompetisi user.
  Pasang di `app/dashboard/arena/page.tsx` atau tab khusus:
  ```tsx
  import ArenaLeaderboard from '@/components/arena/ArenaLeaderboard'
  <ArenaLeaderboard />
  ```
- Untuk creator mencatat hasil, panggil dari halaman detail tim:
  ```ts
  await fetch(`/api/arena/${postId}/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placement: 'juara_1', note: 'Nasional 2026' }),
  })
  ```

---

## ✅ 4. Tambah Teman — Cari by NEXA ID / QR

> Cari by NEXA ID **sudah jalan** di `/api/friends/search` (otomatis deteksi input angka → cari `nexa_id`). Batch ini menambah sisi QR.

**Langkah 1 — install 2 dependency:**
```bash
npm i qrcode.react html5-qrcode
```

**Langkah 2 — UI (drop-in):**
- `src/components/friends/MyNexaQrCard.tsx` — kartu NEXA ID + QR kamu (untuk dibagikan/discan).
  ```tsx
  <MyNexaQrCard nexaId={profile.nexa_id} fullName={profile.full_name} />
  ```
- `src/components/friends/NexaQrScanner.tsx` — scan QR teman → keluarkan nexaId.
  ```tsx
  <NexaQrScanner onFound={(nexaId) => setQuery(nexaId) /* lalu jalankan search */} />
  ```

**Langkah 3 (opsional) — auto-add via link QR:**
QR berisi link `.../dashboard/friends?add=<nexaId>`. Di halaman Friends, baca `searchParams.add`
lalu otomatis jalankan pencarian/tampilkan tombol "Tambah". (Kecil; bisa kutambahkan kalau mau.)

---

## Ringkasan semua batch
- Batch 1: AI multi-provider gratis + i18n + fix BUG-002/008 (+patch 001/007/009)
- Batch 2: versi 1.6.23 + NEXA Assistant (chatbot)
- Batch 3: input deadline 1 baris (NL) + Study Room voice/video (Jitsi)
- Batch 4 (ini): Arena leaderboard tim + badge, Friends QR (NEXA ID search sudah ada)

Selamat — keempat permintaan fitur sudah tercakup. Tinggal pasang, set ENV AI, jalankan 2 migration (presence + arena), dan `npm i` 2 dependency QR.
