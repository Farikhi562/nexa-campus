# DIKTAT.AI
## *AI-Powered Mock Exam & CBT Simulator untuk Mahasiswa*

### Proposal Bisnis — Business Plan Competition "Zero To Cash" 2026
**HIMAMEN — Himpunan Mahasiswa Manajemen**

---

## DAFTAR ISI

1. Ringkasan Eksekutif
2. Gambaran Bisnis
3. Struktur Perusahaan
4. Operasional
5. Strategi Pemasaran dan Metode Promosi
6. Keuangan
7. Peluang Keberlanjutan Usaha
8. Penutup

---

## 1. RINGKASAN EKSEKUTIF

**Diktat.AI** adalah platform perangkat lunak berbasis langganan (*Software as a Service*/SaaS) yang mengubah diktat dan kumpulan soal ujian konvensional menjadi simulasi ujian berbasis komputer (*Computer-Based Test*/CBT) yang cerdas dan interaktif. Platform ini dirancang khusus untuk mahasiswa Indonesia yang membutuhkan cara belajar lebih efektif, terukur, dan berbasis data menjelang ujian tengah semester maupun akhir semester.

**Permasalahan yang Diselesaikan**

Mahasiswa Indonesia menghadapi tiga permasalahan mendasar dalam persiapan ujian: (1) tidak mengetahui topik mana yang paling relevan dan berpeluang keluar dalam ujian; (2) tidak memiliki akses ke simulasi CBT yang disesuaikan dengan materi mata kuliah spesifik mereka; dan (3) belajar secara pasif tanpa *feedback* instan dan *progress tracking* yang terukur. Diktat fisik yang mahal dan tidak interaktif tidak mampu menjawab kebutuhan ini.

**Solusi Digital**

Diktat.AI memungkinkan pengguna mengunggah dokumen diktat atau kumpulan soal ujian lama dalam format PDF. Sistem secara otomatis mengekstrak teks menggunakan teknologi *Optical Character Recognition* (OCR), kemudian kecerdasan buatan (*Artificial Intelligence*/AI) mengurai dan menyusun soal-soal tersebut menjadi sesi mock exam yang siap dikerjakan langsung di *browser*. Seluruh proses berlangsung dalam waktu kurang dari dua menit.

**Keunggulan Teknologi**

Platform dibangun menggunakan Next.js (App Router), Tailwind CSS, dan Supabase sebagai infrastruktur *backend* dan basis data. Integrasi API OCR dan *Large Language Model* (LLM) memungkinkan pemrosesan dokumen secara otomatis dengan akurasi tinggi. Tiga fitur diferensiasi utama yang membedakan Diktat.AI dari kompetitor adalah: (1) **Telegram Reminder Bot** yang mengirimkan pengingat ujian dan tautan langsung ke sesi CBT secara otomatis; (2) **Ekspor Hasil Ujian ke PDF** sebagai laporan belajar mandiri yang dapat dibagikan; dan (3) **Study Room & Leaderboard** yang memungkinkan mahasiswa bersaing dengan rekan sekelas secara daring.

**Potensi Keuntungan**

Dengan modal awal sebesar Rp500.000 dan tiga tingkatan paket langganan (Gratis, Basic Rp19.000/bulan, Pro Rp39.000/bulan), Diktat.AI memproyeksikan pencapaian *Break Even Point* (BEP) dalam 14 hari fase penjualan pertama melalui akuisisi 20–35 pengguna berbayar. Dalam tiga bulan pertama, platform menargetkan 200 pengguna aktif dengan potensi pendapatan bulanan sebesar Rp3.000.000–Rp5.000.000.

---

## 2. GAMBARAN BISNIS

### 2.1 Latar Belakang Permasalahan

Setiap semester, jutaan mahasiswa di Indonesia memasuki periode ujian dengan tingkat kecemasan yang tinggi dan persiapan yang tidak optimal. Berdasarkan pengamatan langsung di lingkungan kampus, ditemukan tiga pola perilaku yang berulang:

**Pertama**, mahasiswa tidak mengetahui bobot dan distribusi topik ujian. Mereka mempelajari seluruh materi secara merata tanpa strategi prioritas, sehingga waktu belajar tidak efisien. **Kedua**, sumber belajar yang tersedia masih bersifat pasif. Diktat fotokopi, catatan tulisan tangan, dan *slide* presentasi dosen tidak memberikan umpan balik (*feedback*) instan. Mahasiswa tidak tahu jawaban mana yang salah hingga hasil ujian keluar berminggu-minggu kemudian. **Ketiga**, simulasi ujian yang relevan dengan mata kuliah spesifik hampir tidak tersedia. Platform latihan soal yang ada di pasar umumnya berfokus pada soal-soal ujian nasional atau sertifikasi, bukan pada materi perkuliahan yang bervariasi antar program studi dan institusi.

Kesenjangan ini menciptakan peluang bisnis yang nyata: sebuah platform yang mampu mengubah dokumen belajar milik mahasiswa sendiri menjadi pengalaman ujian yang interaktif, personal, dan berbasis data.

### 2.2 Deskripsi Produk

Diktat.AI adalah *web application* yang dapat diakses melalui *browser* di perangkat apa pun tanpa perlu mengunduh aplikasi tambahan. Alur penggunaan inti adalah sebagai berikut:

1. Pengguna mendaftar dan masuk ke platform menggunakan akun Google atau email.
2. Pengguna mengunggah dokumen diktat atau kumpulan soal dalam format PDF (maksimal 10 MB).
3. Sistem memproses dokumen secara otomatis menggunakan OCR untuk mengekstrak teks, dilanjutkan dengan pemrosesan LLM untuk mengurai dan menyusun soal beserta pilihan jawaban.
4. Pengguna memulai sesi *mock exam* dengan antarmuka CBT yang menampilkan soal satu per satu, dilengkapi timer dan navigasi bebas antar soal.
5. Setelah ujian selesai, sistem menampilkan skor, rincian jawaban benar dan salah, serta laporan yang dapat diekspor dalam format PDF.

**Fitur Utama per Paket:**

| Fitur | Gratis | Basic (Rp19.000/bln) | Pro (Rp39.000/bln) |
|---|:---:|:---:|:---:|
| Upload Dokumen | 1 dokumen | 5 dokumen | Tidak terbatas |
| Mock Exam (sesi) | 1 sesi | Tidak terbatas | Tidak terbatas |
| Ekspor Hasil ke PDF | — | ✓ | ✓ |
| Telegram Reminder Bot | — | — | ✓ |
| Study Room & Leaderboard | — | — | ✓ |

### 2.3 Penetapan Harga

Penetapan harga didasarkan pada analisis perilaku konsumen mahasiswa Indonesia. Harga paket Basic sebesar Rp19.000 per bulan tetap berada di kisaran biaya fotokopi materi kuliah, sementara paket Pro pada Rp39.000 per bulan diposisikan untuk fitur AI premium, kolaborasi, dan otomasi belajar yang lebih lengkap.

### 2.4 Visi dan Misi

**Visi:** Menjadi platform persiapan ujian berbasis kecerdasan buatan yang paling relevan dan terjangkau bagi mahasiswa Indonesia.

**Misi:**
- Mengotomatisasi proses konversi materi belajar menjadi pengalaman ujian yang interaktif dan personal.
- Memberikan *insight* berbasis data kepada mahasiswa tentang kesiapan dan kelemahan akademis mereka.
- Membangun ekosistem belajar kolaboratif yang mendorong akuntabilitas dan motivasi antar sesama mahasiswa.

### 2.5 Analisis SWOT

**Kekuatan (*Strengths*):**
- Produk digital dengan biaya marginal mendekati nol — tidak ada biaya produksi fisik per unit.
- Pendekatan "bawa dokumenmu sendiri" (*Bring Your Own Document*) menghilangkan kebutuhan kurasi konten, sekaligus membuat produk relevan untuk semua jurusan dan mata kuliah tanpa terkecuali.
- Fitur Telegram Reminder Bot memanfaatkan platform komunikasi yang sudah menjadi kebiasaan sehari-hari mahasiswa Indonesia.
- *Stack* teknologi modern (Next.js, Supabase) memungkinkan iterasi produk yang cepat dengan tim yang ramping.

**Kelemahan (*Weaknesses*):**
- Kualitas *output* OCR sangat bergantung pada kualitas dokumen yang diunggah pengguna. Dokumen bergambar atau berformat tidak standar dapat menghasilkan ekstraksi yang tidak akurat.
- Sebagai produk baru tanpa rekam jejak, kepercayaan awal pengguna perlu dibangun secara aktif melalui pembuktian nilai (*value proof*) sebelum konversi ke berbayar.
- Tim yang sangat kecil membatasi kapasitas pengembangan fitur baru secara paralel.

**Peluang (*Opportunities*):**
- Penetrasi internet dan penggunaan *smartphone* di kalangan mahasiswa Indonesia terus meningkat, memperluas pasar yang dapat dijangkau secara digital.
- Belum ada kompetitor langsung yang menggabungkan OCR dokumen personal dengan simulasi CBT dan fitur sosial dalam satu platform terpadu untuk pasar Indonesia.
- Siklus ujian kampus yang terjadi dua kali per semester menciptakan puncak permintaan (*demand spike*) yang dapat diprediksi dan dimanfaatkan untuk kampanye pemasaran bertarget.

**Ancaman (*Threats*):**
- Risiko pengguna menggunakan layanan AI generik (ChatGPT, Gemini) sebagai alternatif untuk membuat soal latihan secara manual.
- Potensi pelanggaran hak cipta jika pengguna mengunggah materi yang dilindungi tanpa izin. Hal ini diatasi melalui klausul tanggung jawab pengguna dalam *Terms of Service*.
- Fluktuasi biaya API pihak ketiga (OpenAI, OCR) yang dapat memengaruhi struktur biaya operasional.

### 2.6 Target Operasional

- **Fase MVP (Mei–Juni 2026):** Meluncurkan versi pertama yang fungsional dengan fitur inti: unggah dokumen, pemrosesan OCR+AI, antarmuka CBT, dan sistem pembayaran.
- **Fase Pertumbuhan (Juli–September 2026):** Mencapai 200 pengguna aktif bulanan, meluncurkan fitur Study Room dan Telegram Bot, serta memulai ekspansi ke jaringan kampus lain.
- **Fase Skala (Oktober 2026 dan seterusnya):** Mengembangkan fitur prediksi topik ujian berbasis analisis pola historis dan mengeksplorasi model kemitraan dengan institusi pendidikan.

---

## 3. STRUKTUR PERUSAHAAN

### 3.1 Filosofi Tim

Diktat.AI dioperasikan dengan prinsip tim ramping (*lean team*) yang memaksimalkan output dengan sumber daya minimal. Setiap anggota tim memiliki tanggung jawab ganda yang mencakup fungsi teknis dan non-teknis, sesuai dengan kebutuhan tahap awal *startup*.

### 3.2 Kebutuhan Sumber Daya Manusia

Tim inti terdiri dari maksimal empat orang dengan pembagian peran sebagai berikut:

**Posisi 1 — *Founder* & *Full-Stack Developer* (Ketua Tim)**

Bertanggung jawab atas pengembangan seluruh lapisan aplikasi, mulai dari *frontend* (Next.js, Tailwind CSS) hingga *backend* (Supabase, API Routes). Selain itu, berperan sebagai pengambil keputusan produk dan pengelola hubungan dengan mitra teknis. Kompetensi yang dibutuhkan: Next.js, Supabase, integrasi API pihak ketiga, dan pemahaman dasar tentang *machine learning* pipeline.

**Posisi 2 — *Product & Marketing Manager***

Bertanggung jawab atas strategi akuisisi pengguna, pengelolaan konten media sosial, dan komunikasi dengan komunitas mahasiswa. Menjalankan kampanye pemasaran organik melalui Instagram, TikTok, dan grup Telegram mahasiswa. Berperan sebagai penghubung antara kebutuhan pengguna dan prioritas pengembangan fitur.

**Posisi 3 — *UI/UX Designer* & *Content Creator***

Bertanggung jawab atas desain antarmuka yang intuitif dan menarik menggunakan Figma, serta produksi konten visual untuk kebutuhan pemasaran. Memastikan pengalaman pengguna (*user experience*) yang mulus dari halaman arahan (*landing page*) hingga antarmuka CBT.

**Posisi 4 — *Business Development* & *Finance Officer***

Bertanggung jawab atas perencanaan keuangan, pemantauan arus kas, pengelolaan hubungan dengan pengguna awal (*early adopters*), dan penjangkauan kemitraan dengan organisasi kemahasiswaan. Mengelola proses pendaftaran dan pembayaran pengguna selama fase penjualan.

### 3.3 Struktur Organisasi

```
             [Ketua Tim / Full-Stack Developer]
                          |
        ┌─────────────────┼─────────────────┐
        |                 |                 |
[Product &        [UI/UX Designer    [Business Dev &
Marketing Mgr]    & Content Creator] Finance Officer]
```

---

## 4. OPERASIONAL

### 4.1 Infrastruktur Teknis

Seluruh infrastruktur Diktat.AI dibangun di atas layanan *cloud* berbasis *free tier* untuk meminimalkan biaya operasional pada tahap awal:

- **Komputasi & Hosting:** Vercel (*free tier*) — *zero-configuration deployment* untuk aplikasi Next.js dengan waktu respons global yang cepat.
- **Basis Data & Autentikasi:** Supabase (*free tier*) — PostgreSQL terkelola dengan sistem autentikasi bawaan, penyimpanan *file*, dan kemampuan *real-time*.
- **OCR:** OCR.space API (*free tier*: 500 halaman/bulan) — ekstraksi teks dari dokumen PDF dan gambar.
- **AI/LLM:** OpenAI GPT-4o-mini API — model yang paling efisien secara biaya dengan akurasi tinggi untuk tugas penguraian teks terstruktur.
- **Pembayaran:** DOKU payment flow — *payment gateway* Indonesia untuk transfer bank, dompet digital, virtual account, dan kartu sesuai konfigurasi merchant.
- **Notifikasi Telegram:** Twilio Telegram API (*free trial*) atau Telegram Bot API (gratis) untuk fitur pengingat otomatis.

### 4.2 Alur Kerja Sistem

Berikut adalah alur kerja sistem secara lengkap dari pengguna mengunggah dokumen hingga mengerjakan *mock exam*:

**Tahap 1 — Unggah Dokumen**
Pengguna mengunggah file PDF melalui antarmuka *drag-and-drop* di *dashboard*. File disimpan sementara di Supabase Storage dan status dokumen dicatat sebagai "sedang diproses" (*processing*) di basis data.

**Tahap 2 — Pemrosesan OCR**
Server memanggil OCR.space API dengan file PDF yang telah diunggah. API mengembalikan teks mentah (*raw text*) dari seluruh halaman dokumen. Teks ini kemudian dibersihkan dari karakter tidak relevan dan disiapkan untuk tahap berikutnya.

**Tahap 3 — Penguraian Soal dengan AI**
Teks hasil OCR dikirimkan ke OpenAI GPT-4o-mini API dengan *prompt* yang didesain secara khusus untuk mengidentifikasi dan mengekstrak soal pilihan ganda beserta pilihan jawaban dan kunci jawaban. *Output* dikembalikan dalam format JSON terstruktur dan disimpan ke tabel `questions` di Supabase.

**Tahap 4 — Antarmuka Mock Exam**
Pengguna memulai sesi ujian. Sistem mengambil soal-soal dari basis data dan menampilkannya satu per satu dengan antarmuka CBT: nomor soal, teks pertanyaan, empat pilihan jawaban, tombol navigasi, dan *countdown timer*. Jawaban pengguna disimpan secara sementara di *client state*.

**Tahap 5 — Penilaian dan Laporan**
Setelah pengguna menekan tombol "Selesai" atau waktu habis, jawaban dikirimkan ke *server* untuk dihitung. Sistem menyimpan hasil sesi ke tabel `exam_sessions` dan menampilkan halaman hasil yang memuat: skor akhir, persentase kebenaran, dan rincian tiap soal. Pengguna paket Basic ke atas dapat mengunduh laporan dalam format PDF menggunakan library `jsPDF`.

**Alur Sistem (Diagram):**

```
[Pengguna] → Upload PDF
                ↓
        [Supabase Storage]
                ↓
        [API Route: /api/process]
                ↓
        [OCR.space API] → Teks Mentah
                ↓
        [OpenAI GPT-4o-mini] → JSON Soal Terstruktur
                ↓
        [Supabase DB: tabel questions]
                ↓
        [Antarmuka CBT — Next.js Frontend]
                ↓
        [Pengguna mengerjakan soal]
                ↓
        [API Route: /api/sessions] → Hitung Skor
                ↓
        [Halaman Hasil + Ekspor PDF]
```

### 4.3 Alur Fitur Telegram Reminder Bot

1. Pengguna (paket Pro) memasukkan jadwal ujian (mata kuliah, tanggal, jam) di *dashboard*.
2. Sistem menyimpan jadwal ke tabel `schedules` di Supabase.
3. *Cron job* yang berjalan setiap pukul 07.00 WIB memeriksa jadwal ujian yang mendekati (H-3, H-1, H-0).
4. Untuk setiap jadwal yang memenuhi kriteria, sistem mengirimkan pesan Telegram otomatis melalui Twilio API berisi pengingat dan tautan langsung ke sesi *mock exam* mata kuliah yang bersangkutan.

### 4.4 Alur Fitur Study Room

1. Pengguna (paket Pro) membuat "ruang belajar" (*study room*) dan memilih dokumen yang akan dijadikan bahan ujian.
2. Sistem menghasilkan kode ruangan unik enam karakter.
3. Pengguna membagikan kode tersebut kepada rekan-rekan sekelas melalui grup Telegram atau media sosial.
4. Peserta yang bergabung dengan kode yang sama mengerjakan soal yang identik.
5. Setelah semua peserta menyelesaikan ujian, sistem menampilkan *leaderboard* peringkat berdasarkan skor dan kecepatan penyelesaian.

---

## 5. STRATEGI PEMASARAN DAN METODE PROMOSI

### 5.1 Analisis STP (Segmentation, Targeting, Positioning)

**Segmentasi Pasar**

Pasar dibagi menjadi dua segmen utama berdasarkan karakteristik psikografis:

- **Segmen A — Mahasiswa Berorientasi Karir:** Mahasiswa aktif semester 2–8 yang memiliki kesadaran tinggi terhadap prestasi akademis sebagai modal memasuki dunia kerja. Aktif di LinkedIn, mengikuti kegiatan kemahasiswaan, dan bersedia mengeluarkan biaya untuk *tools* yang memberikan nilai nyata.
- **Segmen B — Mahasiswa Menjelang Ujian:** Seluruh mahasiswa yang memasuki periode UTS/UAS dan merasakan tekanan persiapan ujian secara akut. Segmen ini bersifat musiman tetapi memiliki *demand* yang sangat tinggi dalam jangka pendek.

**Target Pasar**

Target utama adalah **Segmen A** untuk akuisisi pengguna berbayar jangka panjang, dan **Segmen B** untuk konversi cepat selama siklus 14 hari fase penjualan. Secara demografis, target adalah mahasiswa S1 aktif berusia 18–24 tahun yang menggunakan *smartphone* sebagai perangkat utama dan familiar dengan transaksi digital.

**Positioning**

Diktat.AI diposisikan sebagai: **"Diktat kamu, ujian kamu — diubah menjadi pengalaman belajar yang cerdas dalam dua menit."** Positioning ini menekankan pada personalisasi (materi berasal dari dokumen pengguna sendiri), kecepatan (proses otomatis kurang dari dua menit), dan kecerdasan (berbasis AI, bukan sekadar *flashcard* manual).

### 5.2 Bauran Pemasaran 4P

**Produk (*Product*)**

Diktat.AI menawarkan tiga lapisan nilai: (1) fungsional — mengerjakan *mock exam* dari materi sendiri; (2) emosional — rasa percaya diri dan kesiapan menghadapi ujian; dan (3) sosial — kompetisi sehat dengan teman melalui *Study Room*. Paket *freemium* memungkinkan pengguna merasakan nilai inti sebelum diminta berkomitmen secara finansial.

**Harga (*Price*)**

Strategi penetapan harga menggunakan pendekatan *value-based pricing* yang disesuaikan dengan daya beli mahasiswa:

| Paket | Harga | Posisi Psikologis |
|---|---|---|
| Gratis | Rp0 | "Coba dulu, tidak ada risiko" |
| Basic | Rp19.000/bulan | "Setara harga satu diktat fotokopi" |
| Pro | Rp39.000/bulan | "Setara dua diktat, tapi jauh lebih powerful" |

**Tempat (*Place*)**

Distribusi sepenuhnya digital melalui *web application* yang dapat diakses dari perangkat apa pun tanpa instalasi. Akuisisi pengguna dilakukan melalui saluran organik: grup Telegram angkatan, komunitas belajar di Telegram, dan media sosial.

**Promosi (*Promotion*)**

Strategi promosi dirancang untuk siklus 14 hari fase penjualan (14–28 Juni 2026) dengan anggaran terbatas:

- **Pemasaran Berbasis Komunitas:** Memanfaatkan koneksi langsung ke jaringan mahasiswa untuk menyebarkan tautan pendaftaran melalui grup Telegram angkatan dan komunitas belajar. Pendekatan ini menghasilkan *word-of-mouth* organik tanpa biaya.
- **Konten Media Sosial:** Pembuatan konten *before-after* di Instagram Reels dan TikTok yang menunjukkan proses transformasi diktat fisik menjadi *mock exam* interaktif dalam 60 detik. Konten ini dirancang untuk mudah dibagikan (*shareable*).
- **Viral Loop melalui Study Room:** Setiap pengguna yang membuat *study room* secara otomatis menjadi agen pemasaran organik dengan mengundang rekan-rekannya. Satu pengguna berpotensi mengakuisisi lima hingga sepuluh pengguna baru tanpa biaya tambahan.
- **Iklan Berbayar Terbatas:** Alokasi Rp100.000 untuk iklan Instagram yang ditargetkan kepada mahasiswa berdasarkan minat akademis dan lokasi geografis selama tujuh hari pertama peluncuran.

### 5.3 Strategi Akuisisi Pengguna dalam 14 Hari

```
Hari 1–3   : Soft launch ke jaringan terdekat, minta feedback dan testimoni awal
Hari 4–7   : Publikasi konten media sosial, aktivasi iklan berbayar Rp100.000
Hari 8–10  : Push promosi "Ujian Bareng" — ajak pengguna buat Study Room
Hari 11–13 : Retargeting pengguna gratis yang belum upgrade dengan penawaran terbatas
Hari 14    : Penutupan dengan pengumuman hasil leaderboard pengguna paling aktif
```

---

## 6. KEUANGAN

### 6.1 Rencana Anggaran Biaya (Modal Awal Rp500.000)

| Komponen Biaya | Estimasi | Keterangan |
|---|---|---|
| OpenAI GPT-4o-mini API | Rp75.000 | ~500.000 token, cukup untuk memproses 50–100 dokumen selama fase MVP |
| Nama Domain (.id atau .site) | Rp150.000 | Pembelian domain satu tahun untuk membangun kredibilitas merek |
| Iklan Instagram/TikTok | Rp100.000 | Kampanye berbayar bertarget selama 7 hari pertama peluncuran |
| OCR.space API | Rp0 | *Free tier*: 500 halaman per bulan, cukup untuk fase MVP |
| Supabase (DB + Storage) | Rp0 | *Free tier*: 500 MB database, 1 GB penyimpanan |
| Vercel (Hosting) | Rp0 | *Free Hobby Plan* untuk Next.js |
| Twilio Telegram / Telegram Bot | Rp0 | *Free trial* Twilio atau Telegram Bot API gratis |
| DOKU *Payment Gateway* | Rp0 | Biaya dipotong dari setiap transaksi sesuai metode pembayaran aktif |
| Dana Cadangan | Rp175.000 | Untuk *overage* API atau kebutuhan tak terduga |
| **Total** | **Rp500.000** | |

### 6.2 Perhitungan Break Even Point (BEP)

BEP dihitung berdasarkan total modal awal yang harus dikembalikan dari pendapatan penjualan selama 14 hari fase penjualan.

**Modal yang harus dikembalikan: Rp500.000**

**Skenario BEP berdasarkan kombinasi paket:**

| Skenario | Pengguna Basic (Rp19.000) | Pengguna Pro (Rp39.000) | Total Pendapatan | Status |
|---|:---:|:---:|---:|---|
| Konservatif | 15 | 8 | Rp425.000 | Belum BEP |
| **Realistis** | **15** | **10** | **Rp475.000** | **Mendekati BEP** |
| **Optimistis** | **20** | **10** | **Rp550.000** | **BEP Tercapai ✓** |

Dengan asumsi biaya layanan DOKU setara 2,9% per transaksi, BEP optimistis bersih adalah:
- Rp550.000 × (1 − 0,029) = **Rp534.045** — BEP tercapai dengan surplus Rp34.045.

**Target pengguna minimum untuk BEP: 30 pengguna berbayar (kombinasi Basic dan Pro).**

Angka ini realistis mengingat jaringan mahasiswa yang dapat diakses langsung oleh tim dan potensi *viral loop* dari fitur Study Room.

### 6.3 Proyeksi Laba Rugi (3 Bulan Pertama)

| Komponen | Bulan 1 (Juni 2026) | Bulan 2 (Juli 2026) | Bulan 3 (Agustus 2026) |
|---|---:|---:|---:|
| **Pendapatan** | | | |
| Paket Basic | Rp225.000 | Rp450.000 | Rp750.000 |
| Paket Pro | Rp250.000 | Rp500.000 | Rp750.000 |
| **Total Pendapatan** | **Rp475.000** | **Rp950.000** | **Rp1.500.000** |
| **Biaya Operasional** | | | |
| OpenAI API | Rp75.000 | Rp150.000 | Rp200.000 |
| Iklan Digital | Rp100.000 | Rp100.000 | Rp150.000 |
| Biaya *Payment Gateway* (2,9%) | Rp13.775 | Rp27.550 | Rp43.500 |
| Biaya Domain (amortisasi) | Rp12.500 | Rp12.500 | Rp12.500 |
| **Total Biaya** | **Rp201.275** | **Rp290.050** | **Rp406.000** |
| **Laba Bersih** | **Rp273.725** | **Rp659.950** | **Rp1.094.000** |

*Catatan: Proyeksi bulan 2 dan 3 mengasumsikan pertumbuhan pengguna sebesar 50% per bulan melalui kombinasi retensi pelanggan lama dan akuisisi pengguna baru.*

### 6.4 Harga Pokok Penjualan (HPP) per Unit

Biaya variabel utama per dokumen yang diproses adalah biaya API:
- OCR: Rp0 (dalam batas *free tier*)
- OpenAI GPT-4o-mini: ~Rp750 per dokumen (estimasi 5.000 token × $0,15/1M token)

HPP per pengguna Basic: Rp750 (biaya API) + Rp435 (*payment fee* 2,9%) = **Rp1.185**
Margin kotor per pengguna Basic: Rp19.000 - Rp1.185 = **Rp17.815 (93,8%)**

Margin kotor yang sangat tinggi ini merupakan keunggulan inheren model bisnis SaaS dibandingkan bisnis berbasis produk fisik.

---

## 7. PELUANG KEBERLANJUTAN USAHA

### 7.1 Evaluasi Hasil Penjualan Fase Pertama

Indikator keberhasilan yang akan dievaluasi setelah 14 hari fase penjualan meliputi: jumlah pengguna terdaftar vs. berbayar (rasio konversi), rata-rata durasi sesi per pengguna, tingkat penyelesaian *mock exam* (*completion rate*), dan sumber akuisisi pengguna yang paling efektif. Data ini akan menjadi dasar keputusan pengembangan fitur pada fase berikutnya.

### 7.2 Roadmap Pengembangan Fitur

**Fase 2 (Juli–September 2026):**
- **Exam Radar:** Fitur AI yang menganalisis pola soal dari beberapa dokumen historis untuk memprediksi topik yang kemungkinan besar keluar dalam ujian mendatang. Fitur ini meningkatkan proposisi nilai produk secara signifikan dan dapat menjadi justifikasi kenaikan harga paket Pro.
- **Progress Analytics Dashboard:** Visualisasi grafis perkembangan skor pengguna dari waktu ke waktu, identifikasi topik yang paling sering salah, dan estimasi persentase kesiapan menghadapi ujian.
- **Spaced Repetition System:** Algoritma yang secara otomatis menjadwalkan ulang soal-soal yang sebelumnya dijawab salah pada interval yang dioptimalkan untuk retensi memori jangka panjang.

**Fase 3 (Oktober 2026 dan seterusnya):**
- **Kemitraan dengan Organisasi Kemahasiswaan:** Menawarkan paket lisensi kelompok (*group license*) kepada himpunan mahasiswa atau unit kegiatan mahasiswa dengan harga per-anggota yang lebih terjangkau. Satu kemitraan dengan organisasi mahasiswa yang memiliki 100 anggota setara dengan akuisisi 100 pengguna berbayar sekaligus.
- **Ekspansi Lintas Kampus:** Mereplikasi strategi akuisisi komunitas ke jaringan kampus lain di luar kampus asal, dimulai dari kota-kota dengan konsentrasi mahasiswa tertinggi.
- **Paket Institusi (B2B):** Menawarkan lisensi kepada program studi atau fakultas untuk digunakan sebagai alat evaluasi pembelajaran internal. Model ini memberikan pendapatan berulang yang lebih stabil dan dapat diprediksi.

### 7.3 Strategi Retensi Pengguna Jangka Panjang

Siklus akademis yang berulang (UTS dan UAS setiap semester) secara alami menciptakan *demand* yang berulang. Strategi retensi berfokus pada tiga hal: (1) memastikan pengguna menyimpan dokumen diktat mereka di platform sehingga ada *switching cost* yang organik; (2) membangun kebiasaan belajar harian melalui fitur *progress tracking* dan pengingat Telegram; dan (3) mendorong keterlibatan sosial melalui Study Room sehingga penggunaan platform menjadi aktivitas sosial, bukan sekadar alat individual.

### 7.4 Potensi Pendapatan Jangka Menengah

Dengan asumsi pertumbuhan pengguna berbayar sebesar 50% per bulan selama enam bulan pertama dan tingkat *churn* di bawah 20%, Diktat.AI memproyeksikan:

- **Bulan 6 (Desember 2026):** ~150 pengguna berbayar aktif, pendapatan bulanan Rp3.000.000–Rp3.750.000.
- **Tahun 1 (Juni 2027):** 500+ pengguna berbayar aktif, pendapatan bulanan Rp7.500.000–Rp12.500.000, dengan potensi profitabilitas penuh setelah overhead tim mulai ditanggung dari pendapatan operasional.

---

## 8. PENUTUP

### 8.1 Kesimpulan

Diktat.AI hadir sebagai solusi konkret atas permasalahan nyata yang dihadapi mahasiswa Indonesia setiap semester: ketidaksiapan menghadapi ujian akibat keterbatasan akses terhadap simulasi yang relevan dan *feedback* yang bermakna. Dengan memanfaatkan teknologi OCR dan kecerdasan buatan, platform ini mengotomatisasi proses yang selama ini dilakukan secara manual dan tidak efisien.

Model bisnis *freemium* yang dipilih memungkinkan pengguna merasakan nilai produk sepenuhnya sebelum memutuskan untuk berlangganan, sehingga mengurangi hambatan adopsi awal. Tiga fitur diferensiasi utama — Telegram Reminder Bot, ekspor laporan PDF, dan Study Room — dirancang secara khusus untuk memenuhi kebiasaan dan kebutuhan spesifik mahasiswa Indonesia, bukan sekadar mengadaptasi solusi dari pasar luar negeri.

Dari sisi finansial, model SaaS dengan biaya marginal mendekati nol dan margin kotor di atas 90% memberikan fondasi yang kuat untuk pertumbuhan yang berkelanjutan. BEP yang ditargetkan dalam 14 hari fase penjualan pertama bukan sekadar angka di atas kertas, melainkan proyeksi yang didasarkan pada strategi akuisisi komunitas yang terencana dan terukur.

### 8.2 Saran Pengembangan

Keberhasilan jangka panjang Diktat.AI bergantung pada dua faktor kritis yang perlu dijaga konsistensinya: kualitas pemrosesan dokumen (akurasi OCR dan penguraian soal oleh AI) dan kecepatan iterasi produk berdasarkan umpan balik pengguna nyata. Tim disarankan untuk memprioritaskan pengumpulan data pengguna sejak hari pertama peluncuran, dan menggunakan data tersebut sebagai kompas pengambilan keputusan produk — bukan asumsi atau intuisi semata.

Dengan eksekusi yang disiplin, Diktat.AI memiliki potensi untuk berkembang dari sebuah proyek kompetisi menjadi platform edukasi yang memberikan dampak nyata bagi ratusan ribu mahasiswa Indonesia.

---

*Proposal ini disusun untuk keperluan Business Plan Competition "Zero To Cash" 2026 yang diselenggarakan oleh HIMAMEN. Seluruh data proyeksi bersifat estimasi berdasarkan riset pasar dan analisis kompetitor yang tersedia pada saat penulisan.*
