# NEXA Campus v1.6.34 — Study Room Call Buttons, Voice Note, Responsive Guard, 30 Badges

Patch ini nambahin:

- Tombol Study Room: **Video Call**, **Voice Only**, **Voice Note**
- Halaman `/dashboard/study-room/[id]/voice-notes`
- API upload/list voice note: `/api/study-room/[id]/voice-notes`
- Jitsi call support mode video/audio
- Voice note pakai MediaRecorder + Supabase Storage bucket `study-room-voice-notes`
- Responsive safety CSS global
- 30 badge baru: Biasa, Langka, Epic, Legend, Mythos
- Page badge: `/dashboard/achievements` dan `/dashboard/badges`

## Cara pasang di Windows CMD

Dari root project:

```bat
xcopy /E /Y "nexa_v1_6_34_study_room_voice_badges_responsive\*" "."
node scripts\install-v1.6.34.mjs
npm run build
```

Jalankan migration SQL di Supabase:

```txt
supabase/migrations/20260615_study_room_voice_notes_badges.sql
```

Lalu commit deploy:

```bat
git add -A
git commit -m "feat: add study room calls voice notes responsive badges"
git push
```

## Test

1. Pastikan akun lu Command.
2. Buka detail Study Room.
3. Harus muncul tombol **Video Call**, **Voice Only**, **Voice Note**.
4. Klik Video Call: `/dashboard/study-room/[id]/call`.
5. Klik Voice Only: `/dashboard/study-room/[id]/call?mode=audio`.
6. Klik Voice Note: `/dashboard/study-room/[id]/voice-notes`.
7. Buka `/dashboard/achievements`, harus muncul 30 badge.

## Catatan

Kalau tombol belum muncul di StudyRoomDetail, berarti script auto-inject gagal karena struktur file beda. Tambahkan manual di file:

```tsx
import StudyRoomCommandActions from '@/components/study-room/StudyRoomCommandActions'

// letakkan di bagian atas JSX detail room
<StudyRoomCommandActions />
```

Voice note dan call dikunci Command karena mengikuti feature gate `study_room_voice_video`.
