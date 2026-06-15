# Testing Checklist — Smart Input Engine (Batch 7)

Checklist manual untuk dijalankan setelah deploy ke preview, sebelum promote ke production.

## 0. Persiapan
- [ ] Migration `docs/MIGRATION_smart_input_logs.sql` sudah dijalankan di Supabase.
- [ ] `npm i pdf-parse mammoth` sudah dijalankan, `npm run build` hijau.
- [ ] Login dengan user **Radar** (free) dan user **Pulse/Command** untuk uji gating.

## 1. Tab "Ketik Manual" (semua plan, termasuk Radar)
- [ ] Isi mata kuliah + tanggal (wajib) → Simpan → muncul toast "Tersimpan!" dan deadline baru muncul di daftar.
- [ ] Coba submit tanpa mata kuliah / tanpa tanggal → tervalidasi dengan pesan error jelas.
- [ ] Centang "Online" → cek di DB `room = 'Online'`. Uncheck → `room = 'Menyusul'`.
- [ ] User **Radar** bisa akses & submit tab ini tanpa lock.
- [ ] Cek `smart_input_logs`: 1 baris baru `input_type='manual'`, `status='confirmed'`.

## 2. Tab "Bahasa Natural" (Pulse/Command)
- [ ] User **Radar**: tab terkunci, tampil CTA upgrade, tidak bisa submit.
- [ ] User **Pulse/Command**, AI aktif: ketik `"besok jam 9 ada quiz kalkulus"` lalu Proses.
      Cek preview: tanggal = besok, jam 09:00, jenis = kuis, mata kuliah = "kalkulus".
- [ ] Ketik `"deadline laporan AI hari Jumat jam 23.59"` → preview: tanggal Jumat terdekat, jam 23:59, jenis = tugas.
- [ ] Ketik `"minggu depan presentasi PKN"` → tanggal terhitung sesuai hari & minggu depan, jenis = presentasi.
- [ ] Ketik teks ambigu tanpa tanggal (mis. `"kerja kelompok sistem informasi"`) → preview muncul dengan
      field **Tanggal ditandai kuning "perlu dicek"**, dan Simpan menolak sampai diisi.
- [ ] Edit field di preview (tanggal/jenis/prioritas) → Simpan → data tersimpan sesuai editan, bukan hasil AI mentah.
- [ ] Uncheck salah satu kandidat (kalau multi-baris) → kandidat itu tidak ikut tersimpan.
- [ ] Cek `smart_input_logs`: `input_type='nlp'`, status awal `parsed`/`fallback`, lalu `confirmed` setelah Simpan.

## 3. Tab "Upload Gambar" (Pulse/Command)
- [ ] User **Radar**: terkunci.
- [ ] Upload screenshot tugas (WA/VClass/Classroom) yang jelas → preview berisi mata kuliah & deadline sesuai gambar.
- [ ] Upload gambar tanpa info tugas (mis. foto pemandangan) → pesan ramah "Tidak ada tugas/deadline yang terbaca...", tidak crash.
- [ ] Upload file >5MB → ditolak dengan pesan ukuran maksimal.
- [ ] Upload format tidak didukung (mis. `.gif`) → ditolak dengan pesan format.
- [ ] Kalau provider AI aktif tidak mendukung vision (mis. Cerebras) → pesan jelas mengarahkan ke tab lain.

## 4. Tab "Upload File" (Pulse/Command)
- [ ] Upload PDF berisi teks (mis. lembar tugas) → teks diekstrak → preview berisi kandidat sesuai isi PDF.
- [ ] Upload PDF hasil scan/gambar (tanpa teks) → pesan ramah mengarahkan ke tab Upload Gambar.
- [ ] Upload `.docx` berisi info tugas → preview muncul sesuai isi.
- [ ] Upload `.doc` (format lama) → pesan jelas "belum didukung, convert ke .docx/PDF".
- [ ] Upload file >8MB → ditolak.
- [ ] Upload file gambar (.jpg) lewat tab ini → tetap diproses via vision AI (tidak error "format tidak didukung").

## 5. Smart Preview (semua mode AI)
- [ ] Preview SELALU muncul sebelum data masuk DB — tidak ada mode yang auto-save tanpa konfirmasi.
- [ ] Field "Mata kuliah" & "Tanggal" kosong/ambigu ditandai kuning + label "perlu dicek".
- [ ] "Simpan Semua" menolak kalau ada kandidat terpilih dengan tanggal/mata kuliah masih kosong.
- [ ] "Batalkan" menutup preview tanpa menyimpan apa pun.
- [ ] Setelah simpan sukses, dashboard ter-refresh dan deadline baru terlihat di daftar.

## 6. Performance / Fallback
- [ ] Matikan `AI_API_KEY` sementara → tab Bahasa Natural tetap menghasilkan kandidat (fallback lokal), bukan error keras.
- [ ] Tab Upload Gambar dengan AI mati → pesan jelas "AI belum aktif...", tidak crash.
- [ ] Waktu klik "Proses" sampai preview muncul terasa cepat (idealnya < 5 detik untuk teks).

## 7. Regresi — fitur lama TIDAK rusak
- [ ] `npm run build` sukses tanpa error baru.
- [ ] Form tambah deadline lama (`/dashboard/deadlines/new`) masih normal.
- [ ] AI Quick Add lama (`/dashboard/deadlines/quick-add`) masih normal.
- [ ] QuickDeadlineBar (1 baris NL, Batch 3) masih normal.
- [ ] Reminder Telegram: trigger `/api/cron/send-reminders` manual → masih mengirim seperti biasa.
- [ ] Notifikasi Push (Batch 6): masih bisa subscribe & menerima notifikasi tes.
- [ ] Pricing/plan gating: user Radar tetap hanya melihat fitur Radar di tempat lain — tidak ada kebocoran akses.
- [ ] Poin leaderboard (`award_points`) tetap bertambah saat deadline baru dibuat lewat Smart Input.

## 8. Mobile check
- [ ] SmartInputBox tidak overflow horizontal di layar kecil (360px).
- [ ] Tab bisa di-scroll horizontal kalau tidak cukup tempat.
- [ ] Tombol upload gambar/file mudah ditekan (target area cukup besar).
- [ ] Preview cards mudah diedit dengan keyboard mobile.
