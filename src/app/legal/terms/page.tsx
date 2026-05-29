import Link from 'next/link'
import { BRAND } from '@/lib/brand'

const sections = [
  {
    title: '1. Penerimaan Syarat',
    body: `Dengan membuat akun, login, mengunggah dokumen, memakai fitur AI, membuat study room, menggunakan marketplace, melakukan pembayaran, atau mengakses layanan ${BRAND.productName}, pengguna dianggap telah membaca, memahami, dan menyetujui Syarat Penggunaan ini serta Kebijakan Privasi ${BRAND.companyName}. Jika tidak setuju, pengguna wajib berhenti menggunakan layanan.`,
  },
  {
    title: '2. Ruang Lingkup Layanan',
    body: `${BRAND.productName} adalah produk resmi ${BRAND.companyName} yang menyediakan layanan belajar digital untuk mahasiswa, termasuk upload dokumen, OCR, mock exam AI berbasis ${BRAND.aiProvider}, Chat with PDF, ringkasan otomatis, analisis kelemahan, jadwal akademik, reminder Telegram, study room, tim belajar, Campus Tools, leaderboard, marketplace kampus, checkout paket, dan fitur lain yang dapat ditambahkan dari waktu ke waktu. ${BRAND.founderTitle}: ${BRAND.founderName}.`,
  },
  {
    title: '3. Kepatuhan Hukum dan Undang-Undang',
    body: 'Pengguna wajib menggunakan NEXA sesuai hukum dan peraturan perundang-undangan yang berlaku di Republik Indonesia, termasuk namun tidak terbatas pada ketentuan tentang informasi dan transaksi elektronik, pelindungan data pribadi, hak cipta, perlindungan konsumen, pendidikan, perpajakan, ketertiban umum, serta ketentuan kampus masing-masing. Pengguna dilarang menggunakan layanan untuk aktivitas ilegal, merugikan pihak lain, atau menghindari kewajiban hukum.',
  },
  {
    title: '4. Akun dan Keamanan',
    body: 'Pengguna bertanggung jawab menjaga keamanan akun, email, kata sandi, akses OAuth, dan perangkat yang digunakan. Pengguna dilarang meminjamkan, menjual, menyewakan, membagikan, atau memindahtangankan akun tanpa izin. Aktivitas yang terjadi melalui akun pengguna dianggap sebagai tanggung jawab pengguna tersebut kecuali dapat dibuktikan terjadi akses tidak sah yang segera dilaporkan kepada support.',
  },
  {
    title: '5. Paket, Harga, dan Midtrans',
    body: `${BRAND.productName} menyediakan paket Free, Basic Rp19.000/bulan, dan Pro Rp39.000/bulan. Pembayaran paket dilakukan melalui ${BRAND.paymentProvider} atau alur admin resmi ${BRAND.companyName}. ${BRAND.productName} tidak menyimpan data kartu, PIN, OTP, CVV, atau kredensial pembayaran pengguna. Paket aktif setelah pembayaran berhasil diverifikasi. Pengguna wajib memastikan email akun yang digunakan saat checkout sudah benar.`,
  },
  {
    title: '6. Aktivasi, Downgrade, dan Akses Fitur',
    body: 'Paket Free memiliki batas penggunaan. Paket Basic membuka fitur belajar utama, ekspor PDF, 5 Campus Tools pertama, marketplace seller, dan study room publik. Paket Pro membuka fitur premium termasuk Chat with PDF, ringkasan otomatis, analisis kelemahan, room private, tim belajar, Telegram reminder, laporan mingguan, priority processing, semua Campus Tools, export multi-format, team seat, dan custom branding. Jika paket berakhir, downgrade, refund, atau dibatalkan, akses fitur premium dapat langsung dihentikan.',
  },
  {
    title: '7. Integrasi Telegram Khusus Pro',
    body: 'Reminder otomatis dan laporan mingguan Telegram hanya tersedia untuk pengguna Pro atau seat yang sah. Pengguna harus menghubungkan akun Telegram melalui bot resmi NEXA, memasukkan chat_id yang benar, dan memastikan bot tidak diblokir. NEXA tidak bertanggung jawab atas pesan yang gagal terkirim karena kesalahan chat_id, akun Telegram berubah, bot diblokir, gangguan Telegram, atau konfigurasi perangkat pengguna.',
  },
  {
    title: '8. Team Seat Pro',
    body: 'Pengguna Pro dapat mengundang maksimal 3 anggota sebagai team seat. Seat member mendapat akses fitur Pro selama owner tetap berstatus Pro. Seat member tidak boleh menjual ulang, memindahtangankan, atau mengundang seat lain. Jika owner downgrade, refund, melanggar aturan, atau akun dihapus, akses Pro seluruh seat dapat dicabut otomatis.',
  },
  {
    title: '9. Upload Dokumen dan Data Sensitif',
    body: 'Pengguna hanya boleh mengunggah dokumen yang dimiliki sendiri, memiliki izin penggunaan, atau boleh digunakan untuk kebutuhan belajar. Pengguna dilarang mengunggah KTP, kartu keluarga, data kesehatan, data keuangan, biometrik, password, token, rahasia dagang, dokumen rahasia kampus, data anak, data pribadi orang lain, dokumen palsu, atau materi yang melanggar hukum. Jika data sensitif terunggah, pengguna wajib segera menghapusnya dan menghubungi support.',
  },
  {
    title: '10. Hak Cipta dan Materi Akademik',
    body: 'Pengguna wajib menghormati hak cipta, lisensi, dan hak kekayaan intelektual pihak lain. Pengguna dilarang mengunggah, membagikan, menjual, menyalin, atau mengekspor materi berhak cipta tanpa izin, termasuk buku digital bajakan, modul berbayar, bank soal rahasia, materi dosen yang tidak boleh disebarkan, atau karya pihak lain yang diklaim sebagai milik sendiri.',
  },
  {
    title: '11. Fitur AI dan Integritas Akademik',
    body: `Fitur AI ${BRAND.productName} ditenagai oleh ${BRAND.aiProvider} dan berfungsi sebagai alat bantu belajar, bukan pengganti proses belajar, dosen, pembimbing akademik, atau penilaian resmi kampus. Pengguna dilarang memakai AI untuk menyontek ujian, joki tugas, membuat karya yang diklaim sepenuhnya sebagai hasil sendiri tanpa proses belajar, plagiarisme, manipulasi jawaban, pemalsuan dokumen, atau pelanggaran etika akademik. Output AI harus diperiksa ulang oleh pengguna.`,
  },
  {
    title: '12. Penyalahgunaan Sistem',
    body: 'Pengguna dilarang melakukan scraping tidak sah, spam, brute force, bypass limit, eksploitasi bug, reverse engineering, prompt injection berbahaya, penyalahgunaan API, membuat akun massal, manipulasi ranking leaderboard, manipulasi pembayaran, atau tindakan lain yang mengganggu keamanan dan ketersediaan layanan.',
  },
  {
    title: '13. Study Room dan Tim Belajar',
    body: 'Study room publik dapat digunakan untuk belajar bersama dan leaderboard. Study room private hanya dapat dibuat pengguna Pro dan wajib memakai password yang tidak dibagikan sembarangan. Tim belajar digunakan untuk kolaborasi akademik yang sah. Pengguna bertanggung jawab atas chat, dokumen, materi, dan aktivitas anggota yang mereka undang.',
  },
  {
    title: '14. Marketplace Kampus',
    body: 'Marketplace NEXA adalah sarana listing dan kontak antar pengguna. Transaksi dilakukan langsung antar pengguna, kecuali disebutkan lain secara tertulis. Penjual wajib memberikan informasi yang benar, harga jelas, kondisi barang atau jasa yang jujur, dan tidak melakukan penipuan. Pembeli wajib memeriksa barang atau jasa sebelum transaksi. NEXA dapat menghapus listing yang melanggar aturan.',
  },
  {
    title: '15. Konten dan Barang Terlarang di Marketplace',
    body: 'Dilarang menjual atau mempromosikan barang ilegal, narkotika, senjata, alkohol, rokok atau vape untuk minor, konten dewasa, jasa joki tugas atau ujian, jual beli akun, data pribadi, dokumen palsu, produk bajakan, materi kampus ilegal, plagiarisme, malware, phishing, penipuan investasi, pinjaman ilegal, atau barang dan jasa yang melanggar hukum Indonesia maupun aturan kampus.',
  },
  {
    title: '16. Leaderboard, Profil Publik, dan Komunitas',
    body: 'Jika profil publik aktif, nama, universitas, skor rata-rata, streak, dan aktivitas belajar tertentu dapat tampil di leaderboard. Pengguna dapat menonaktifkan profil publik melalui pengaturan. Pengguna wajib menjaga etika komunikasi, tidak melakukan pelecehan, ujaran kebencian, doxing, ancaman, diskriminasi, atau tindakan yang merugikan komunitas.',
  },
  {
    title: '17. Refund Policy',
    body: 'Refund dapat diajukan maksimal 3 hari setelah pembayaran jika paket belum aktif, terjadi pembayaran ganda, atau fitur utama tidak dapat digunakan karena kesalahan sistem NEXA. Refund tidak berlaku jika paket sudah digunakan secara wajar, pengguna melanggar aturan, akun dinonaktifkan karena penyalahgunaan, pengguna salah memasukkan data, atau kendala berasal dari layanan pihak ketiga di luar kontrol NEXA.',
  },
  {
    title: '18. Batas Tanggung Jawab',
    body: 'NEXA berusaha menyediakan layanan yang stabil, aman, dan bermanfaat, tetapi tidak menjamin layanan selalu bebas gangguan, bebas error, atau akurat sepenuhnya. NEXA tidak bertanggung jawab atas keputusan akademik pengguna, kerugian transaksi antar pengguna, kegagalan notifikasi pihak ketiga, kesalahan output AI, tindakan pengguna, atau pelanggaran hukum yang dilakukan pengguna.',
  },
  {
    title: '19. Penangguhan, Penghapusan Konten, dan Penutupan Akun',
    body: 'NEXA berhak membatasi fitur, menghapus konten, menolak listing, menahan aktivasi, menangguhkan akun, atau menutup akun jika pengguna melanggar Syarat Penggunaan, Kebijakan Privasi, hukum yang berlaku, instruksi aparat berwenang, atau aturan komunitas. Jika diperlukan, NEXA dapat menyimpan data tertentu untuk kepentingan audit, keamanan, penyelesaian sengketa, atau kewajiban hukum.',
  },
  {
    title: '20. Penghapusan Akun dan Dokumen',
    body: 'Pengguna dapat menghapus dokumen dari dashboard materi. Untuk penghapusan akun, pengguna harus menghubungi support resmi dan menyertakan email akun. Penghapusan akun bersifat permanen dan dapat menghapus profil, dokumen, soal, sesi ujian, reminder, tim belajar, chat PDF, team seat, marketplace listing, dan data terkait sesuai batas kemampuan teknis serta kewajiban hukum.',
  },
  {
    title: '21. Perubahan Layanan dan Syarat',
    body: 'NEXA dapat mengubah fitur, harga, paket, limit penggunaan, integrasi pihak ketiga, kebijakan refund, dan Syarat Penggunaan dari waktu ke waktu. Perubahan material akan diinformasikan melalui aplikasi, email, atau kanal resmi lain. Penggunaan layanan setelah perubahan berlaku dianggap sebagai persetujuan atas perubahan tersebut.',
  },
  {
    title: '22. Kontak Resmi',
    body: `Kontak resmi ${BRAND.companyName} adalah Telegram bot @NEXATchBot, email nexatechlabs271@gmail.com, dan domain ${BRAND.domain}. Gunakan kontak resmi untuk support, aktivasi paket, paket kampus, checkout ${BRAND.paymentProvider}, refund, pelaporan konten, penghapusan akun, dan permintaan terkait data pribadi.`,
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <article className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold text-brand-700">{BRAND.productName}</Link>
        <h1 className="mt-4 text-4xl font-black">Syarat Penggunaan</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Terakhir diperbarui: 29 Mei 2026. Dokumen ini mengatur penggunaan {BRAND.productName} oleh {BRAND.companyName} dan dibuat agar layanan dipakai secara aman, etis, dan patuh terhadap hukum serta peraturan yang berlaku di Indonesia.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-lg font-black text-slate-950">{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}
