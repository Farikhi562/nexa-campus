import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowLeft,
  BellRing,
  BookOpenCheck,
  CreditCard,
  HelpCircle,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Users,
  Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ NEXA Campus v1.0 - NEXA Campus Ecosystem',
  description:
    'Pertanyaan umum resmi NEXA Campus Ecosystem v1.0 tentang akun, fitur belajar, marketplace, paket, Midtrans, dan support.',
}

const FAQ_GROUPS = [
  {
    title: 'Akun dan akses',
    icon: ShieldCheck,
    items: [
      ['NEXA Campus v1.0 itu apa?', 'NEXA Campus Ecosystem v1.0 adalah platform mahasiswa untuk belajar dari midtransmen, latihan mock exam, mengatur reminder akademik, membuka marketplace kampus, dan memakai AI Campus Tools. Tersedia fitur kolaborasi tim belajar, leaderboard antar kampus, dan analisis kelemahan belajar berbasis AI.'],
      ['Apakah harus login?', 'Ya. Login diperlukan untuk menyimpan profil, midtransmen, reminder, marketplace, tim belajar, dan hasil belajar.'],
      ['Kenapa harus lengkapi profil?', 'Profil membantu NEXA menyesuaikan pengalaman kampus, jurusan, leaderboard, marketplace, dan rekomendasi fitur. Profil lengkap juga diperlukan untuk fitur leaderboard antar kampus.'],
    ],
  },
  {
    title: 'Belajar dan AI',
    icon: BookOpenCheck,
    items: [
      ['Bagaimana mock exam AI bekerja?', 'Upload midtransmen PDF belajar → AI mengekstrak teks → membuat soal pilihan ganda dengan pembahasan → kamu latihan dan dapat skor. Progress tersimpan otomatis.'],
      ['Chat with PDF itu apa?', 'Fitur Pro eksklusif yang memungkinkan kamu tanya jawab langsung ke midtransmen yang sudah diupload. Misalnya "Jelaskan konsep di bab 3" atau "Buat contoh soal dari topik ini" — AI menjawab berdasarkan isi midtransmenmu.'],
      ['Apa itu analisis kelemahan AI?', 'Setelah menyelesaikan minimal 3 exam, AI menganalisis pola kesalahanmu dan memberikan rekomendasi spesifik topik yang perlu dipelajari ulang. Fitur ini eksklusif untuk paket Pro.'],
      ['Apakah jawaban AI selalu benar?', 'Tidak selalu. AI membantu mempercepat belajar, tetapi kamu tetap perlu mengecek ulang materi penting sebelum ujian asli.'],
      ['Campus Tools bisa dipakai untuk apa?', 'Basic membuka 5 tools, Pro membuka semua 15+ tools: kalkulator IPK, generator sitasi, ringkasan AI, career assistant, habit tracker, pomodoro timer, konverter nilai, planner semester, generator abstrak, parafrase AI, cek plagiarisme, translator akademik, mind map generator, flashcard generator, dan event kampus.'],
    ],
  },
  {
    title: 'Reminder dan notifikasi',
    icon: BellRing,
    items: [
      ['Reminder dasar bisa dipakai siapa?', 'Semua user bisa menyimpan agenda tugas, ujian, praktikum, kuis, presentasi, dan organisasi. Reminder tersimpan dan tampil di timeline dalam app.'],
      ['Notifikasi in-app itu apa?', 'Semua user mendapat notifikasi di dalam aplikasi (ikon lonceng) untuk reminder yang jatuh tempo, hasil exam selesai, dan badge yang diraih. Tidak perlu koneksi Telegram.'],
      ['Reminder otomatis Telegram tersedia di paket apa?', 'Reminder otomatis via Telegram dan laporan performa mingguan hanya tersedia untuk paket Pro. Kamu perlu menghubungkan akun Telegram melalui bot @NEXATchBot terlebih dahulu.'],
      ['Bagaimana cara hubungkan Telegram?', 'Buka Pengaturan → Hubungkan Telegram → ikuti instruksi untuk chat /start ke @NEXATchBot → dapatkan kode verifikasi → masukkan ke NEXA. Setelah terhubung, reminder otomatis langsung aktif.'],
    ],
  },
  {
    title: 'Study Room dan Tim',
    icon: Users,
    items: [
      ['Study Room untuk apa?', 'Study Room membantu belajar bareng teman menggunakan kode room, sesi latihan soal bersama, dan leaderboard antar anggota.'],
      ['Apa bedanya Study Room dan Tim Belajar?', 'Study Room bersifat sementara untuk sesi belajar sekali pakai. Tim Belajar (paket Pro) bersifat permanen dengan shared document library, chat grup, dan leaderboard internal yang tersimpan sepanjang semester.'],
      ['Apa itu Study Room Private?', 'Fitur Pro yang memungkinkan kamu membuat room dengan password dan batas anggota custom. Room tidak akan muncul di daftar publik dan hanya bisa diakses dengan password.'],
      ['Berapa maksimal anggota tim?', 'Basic bisa bergabung ke tim yang sudah ada. Pro bisa membuat tim sendiri. Jumlah anggota tidak dibatasi, tetapi team seat (fitur yang memberi akses Pro gratis ke anggota) maksimal 3 orang per akun Pro.'],
    ],
  },
  {
    title: 'Marketplace kampus',
    icon: Store,
    items: [
      ['Siapa yang bisa jual barang dan jasa?', 'Akun Basic dan Pro bisa membuat listing. Akun Free bisa melihat marketplace dan menghubungi seller.'],
      ['Apa saja yang boleh dijual?', 'Barang dan jasa yang relevan untuk kebutuhan mahasiswa, seperti buku, alat praktikum, jasa desain, tutoring, catatan, atau kebutuhan kampus lain yang legal dan tidak melanggar kebijakan NEXA.'],
      ['Apakah NEXA menahan dana transaksi marketplace?', 'Di v1.0, marketplace berfungsi sebagai listing dan kontak. Transaksi antar user dilakukan langsung dengan prinsip aman dan jujur. NEXA tidak menjadi perantara pembayaran marketplace.'],
    ],
  },
  {
    title: 'Paket dan pembayaran',
    icon: CreditCard,
    items: [
      ['Apa bedanya Free, Basic, dan Pro?', 'Free untuk mencoba core learning (1 midtransmen, 1 exam). Basic Rp19.000/bulan membuka mock exam tak terbatas, ekspor PDF, 5 Campus Tools, dan hak jual di marketplace. Pro Rp39.000/bulan membuka semua fitur termasuk Chat with PDF, analisis kelemahan, tim belajar, room private, Telegram reminder, laporan mingguan, prediksi nilai, 15+ Campus Tools, ekspor Anki/Quizlet/Word, dan 3 team seat.'],
      ['Pembayaran pakai apa?', 'NEXA v1.0 diarahkan ke Midtrans checkout atau admin untuk aktivasi awal.'],
      ['Setelah bayar, paket aktif kapan?', 'Paket diaktifkan setelah pembayaran Midtrans atau konfirmasi admin selesai. Pastikan email akun NEXA sama dengan data checkout.'],
      ['Team Seat itu apa?', 'Fitur Pro yang memungkinkan kamu mengundang hingga 3 orang untuk menikmati fitur Pro tanpa mereka perlu berlangganan sendiri. Cocok untuk grup belajar atau pengurus organisasi kampus.'],
      ['Bagaimana jika saya ingin refund?', 'Refund bisa diajukan maksimal 3 hari setelah pembayaran jika paket belum aktif, ada pembayaran ganda, atau fitur utama tidak berfungsi karena kesalahan sistem NEXA. Hubungi admin via Telegram 085697916845 atau email nexatechlabs271@gmail.com.'],
    ],
  },
  {
    title: 'Fitur Pro eksklusif',
    icon: Star,
    items: [
      ['Apa saja fitur yang hanya ada di Pro?', 'Chat with PDF, analisis kelemahan AI, ringkasan otomatis, study room private, tim belajar permanen, shared document ke tim, laporan mingguan Telegram, prediksi nilai UTS/UAS, priority AI processing, semua 15+ Campus Tools, ekspor Anki/Quizlet/Word, sub-akun team seat, dan custom branding study room.'],
      ['Apa itu Priority Processing?', 'Upload PDF pengguna Pro diproses lebih dahulu dibanding Free/Basic saat server sedang ramai. Kamu juga melihat badge "⚡ Priority" pada progress upload.'],
      ['Apa itu prediksi nilai?', 'Berdasarkan rata-rata skor mock exam di mata kuliah tertentu, AI memperkirakan performa ujian asli dan memberi tips spesifik. Tampil di halaman Jadwal Ujian di samping countdown UTS/UAS.'],
      ['Bagaimana cara share hasil exam ke medsos?', 'Setelah exam selesai, klik "Bagikan Hasil" di halaman hasil untuk men-generate kartu skor bergambar yang bisa didownload dan dibagikan ke story Instagram atau Telegram. Gratis untuk semua paket.'],
    ],
  },
  {
    title: 'Jadwal dan Leaderboard',
    icon: Send,
    items: [
      ['Bagaimana cara input jadwal UTS/UAS?', 'Buka halaman Jadwal → tambah jadwal manual (nama ujian, mata kuliah, tanggal, ruangan) atau upload PDF kalender akademik kampus → AI ekstrak otomatis semua tanggal ujian → konfirmasi dan simpan. Countdown otomatis muncul dengan warna urgensi.'],
      ['Apakah jadwal bisa dibagikan ke mahasiswa lain?', 'Ya. Jika kamu mengaktifkan opsi publik saat simpan jadwal, mahasiswa dari kampus yang sama bisa melihat dan menggunakan jadwal tersebut sebagai referensi. Ini membantu membangun database jadwal kampus secara crowdsource.'],
      ['Leaderboard itu berdasarkan apa?', 'Leaderboard kampus menampilkan top mahasiswa dari universitas yang sama berdasarkan rata-rata skor exam dan total exam yang diselesaikan. Leaderboard nasional menampilkan ranking per universitas. Kamu bisa menonaktifkan profil publik di pengaturan jika tidak ingin muncul di leaderboard.'],
    ],
  },
  {
    title: 'Support dan keamanan',
    icon: HelpCircle,
    items: [
      ['Kalau profil gagal disimpan bagaimana?', 'Coba refresh dan login ulang. Jika masih gagal, hubungi admin dengan email akun, nama, dan screenshot error.'],
      ['Apakah midtransmen saya aman?', 'Midtransmen dipakai hanya untuk fitur belajar akun kamu. Teks hasil ekstraksi disimpan terenkripsi. Jangan upload midtransmen yang melanggar hak cipta atau berisi data sensitif orang lain.'],
      ['Data apa saja yang dikumpulkan NEXA?', 'Profil akademik, midtransmen belajar, hasil exam, streak, badge, notifikasi, dan Telegram Chat ID (jika dihubungkan). Selengkapnya di halaman Kebijakan Privasi.'],
      ['Bagaimana cara hubungi admin?', 'Gunakan chatbot di pojok kanan bawah, atau langsung ke Telegram 085697916845 / email nexatechlabs271@gmail.com untuk aktivasi paket, refund, dan support akun.'],
    ],
  },
]

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-700 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
            <MessageCircle className="h-4 w-4" />
            Kontak
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              NEXA Campus v1.0
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              FAQ resmi untuk user NEXA.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Halaman ini menjawab pertanyaan umum tentang akun, fitur belajar, marketplace, paket, Midtrans, dan support NEXA Campus Ecosystem v1.0.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ['Versi', 'v1.0'],
                ['Basic', 'Rp19.000/bulan'],
                ['Pro', 'Rp39.000/bulan'],
                ['Payment', 'Midtrans ready'],
                ['Support', 'Chatbot + Contact'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {FAQ_GROUPS.map(({ title, icon: Icon }) => (
                <a
                  key={title}
                  href={`#${title.toLowerCase().replaceAll(' ', '-')}`}
                  className="rounded-lg border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50"
                >
                  <Icon className="h-5 w-5 text-brand-600" />
                  <p className="mt-3 text-sm font-black">{title}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="space-y-6">
          {FAQ_GROUPS.map(({ title, icon: Icon, items }) => (
            <section
              key={title}
              id={title.toLowerCase().replaceAll(' ', '-')}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black">{title}</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {items.map(([question, answer]) => (
                  <div key={question} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="font-black text-slate-950">{question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-brand-200 bg-brand-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Zap className="mt-1 h-6 w-6 flex-shrink-0 text-brand-700" />
              <div>
                <h2 className="text-lg font-black">Masih bingung?</h2>
                <p className="mt-1 text-sm leading-6 text-brand-900">
                  Gunakan chatbot di pojok kanan bawah atau hubungi admin untuk aktivasi paket, Midtrans, dan support akun.
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700"
            >
              <Users className="h-4 w-4" />
              Hubungi Admin
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
