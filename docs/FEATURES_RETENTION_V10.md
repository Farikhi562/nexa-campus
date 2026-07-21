# NEXA Campus Retention Intelligence v10

## Fitur

1. Weekly Review otomatis dari deadline, Focus Mode, dan Daily Pulse.
2. Smart Reschedule memilih hari paling ringan dalam 10 hari berikutnya.
3. Focus streak: current streak, best streak, recovery status, dan heatmap 12 minggu.
4. Flashcard spaced repetition dengan jadwal review 1, 3, 7, hingga 30 hari.

## Instalasi

1. Jalankan `supabase/migrations/20260721_productivity_depth.sql` bila belum.
2. Jalankan `supabase/migrations/20260721_retention_intelligence.sql`.
3. Timpa source aplikasi dengan isi ZIP.
4. Tes halaman dashboard, deadline, focus, dan study flashcard.

Smart Reschedule memakai kepadatan deadline sebagai sinyal. Integrasi jadwal kuliah bisa ditambahkan nanti bila tabel jadwal sudah stabil.
