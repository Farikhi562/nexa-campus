import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold text-brand-700">NEXA Campus Ecosystem</Link>
        <h1 className="mt-4 text-4xl font-black">Syarat Penggunaan</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Terakhir diperbarui: 29 Mei 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Layanan</h2>
            <p>NEXA adalah platform belajar, reminder akademik, study room, marketplace, dan Campus Tools untuk mahasiswa Indonesia. Pengguna bertanggung jawab atas konten yang diunggah, hasil penggunaan fitur AI, interaksi dalam tim belajar, dan listing yang dibuat di marketplace.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Paket dan Pembayaran</h2>
            <p>NEXA menyediakan tiga paket layanan. Paket Free dapat mencoba fitur dasar dengan batasan. Paket Basic seharga Rp19.000/bulan membuka mock exam tak terbatas, ekspor PDF, 5 Campus Tools, dan hak jual di marketplace. Paket Pro seharga Rp39.000/bulan membuka seluruh fitur termasuk Chat with PDF, analisis kelemahan AI, ringkasan otomatis, study room private, tim belajar permanen, laporan mingguan via Telegram, prediksi nilai, priority processing, semua 15+ Campus Tools, ekspor multi-format (Anki, Quizlet, Word), dan 3 sub-akun/team seat. Pembayaran dilakukan melalui Midtrans atau alur admin resmi. Paket aktif setelah pembayaran terkonfirmasi.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Team Seat (Paket Pro)</h2>
            <p>Pengguna Pro dapat mengundang maksimal 3 orang sebagai team seat yang mendapat akses fitur Pro tanpa membayar sendiri. Team seat tidak dapat mengundang seat lain. Jika pemilik Pro downgrade atau akun dihapus, seluruh team seat kehilangan akses Pro secara otomatis. Penyalahgunaan fitur team seat untuk dijual atau diperjualbelikan kepada pihak ketiga melanggar syarat penggunaan ini.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Refund Policy</h2>
            <p>Refund dapat diajukan maksimal 3 hari setelah pembayaran jika paket belum aktif, terjadi pembayaran ganda, atau fitur utama tidak dapat digunakan karena kesalahan sistem NEXA. Refund tidak berlaku untuk penyalahgunaan akun, pelanggaran aturan, atau pembelian yang sudah digunakan secara wajar. Pengajuan refund dilakukan melalui Telegram admin 085697916845 atau email nexatechlabs271@gmail.com.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Fitur AI dan Batasan Penggunaan</h2>
            <p>Fitur AI NEXA termasuk mock exam, Chat with PDF, ringkasan otomatis, analisis kelemahan, prediksi nilai, dan Campus Tools ditenagai oleh Google Gemini. NEXA menerapkan rate limiting untuk melindungi layanan dari penyalahgunaan. Pengguna yang terdeteksi menyalahgunakan API, melakukan scraping, atau memanipulasi sistem dapat dinonaktifkan tanpa peringatan. Output AI bersifat bantuan belajar dan harus diperiksa kembali oleh pengguna sebelum digunakan untuk keperluan akademik resmi.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Integrasi Telegram</h2>
            <p>Fitur Smart Reminder otomatis dan laporan mingguan (paket Pro) dikirim melalui Telegram via bot resmi @NEXATchBot. Pengguna wajib melakukan verifikasi chat ID melalui bot sebelum fitur aktif. NEXA tidak bertanggung jawab atas notifikasi yang tidak terkirim akibat pemblokiran bot oleh pengguna, perubahan akun Telegram, atau gangguan layanan Telegram di luar kendali NEXA.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Study Room dan Tim Belajar</h2>
            <p>Study Room publik dapat diakses oleh semua pengguna terdaftar. Study Room private (paket Pro) hanya dapat diakses dengan password yang ditetapkan oleh pembuat room. Tim belajar permanen (paket Pro) bersifat kolaboratif — anggota dapat mengakses midtransmen yang dibagikan dalam tim. Pengguna bertanggung jawab atas konten yang dibagikan dalam room dan tim. NEXA berhak menutup room atau tim yang melanggar aturan komunitas.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Ekspor Konten</h2>
            <p>Pengguna Basic dan Pro dapat mengekspor hasil exam dalam format PDF. Pengguna Pro dapat mengekspor ke format tambahan termasuk Anki flashcard (.apkg), Quizlet, dan Word (.docx). Konten yang diekspor hanya boleh digunakan untuk keperluan belajar pribadi dan tidak boleh didistribusikan, dijual, atau diklaim sebagai karya sendiri tanpa proses belajar yang sesungguhnya.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Leaderboard dan Profil Publik</h2>
            <p>Data pengguna dengan profil publik aktif (nama, universitas, skor rata-rata, streak) dapat ditampilkan di leaderboard kampus dan nasional. Pengguna dapat menonaktifkan profil publik kapan saja melalui pengaturan. NEXA tidak menjamin akurasi ranking leaderboard secara real-time.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Marketplace dan Konten Terlarang</h2>
            <p>Transaksi marketplace dilakukan antar pengguna. NEXA menyediakan sarana listing dan kontak, tetapi pengguna wajib bertransaksi secara aman dan jujur. Konten terlarang meliputi barang ilegal, narkotika, senjata, alkohol, rokok/vape untuk minor, konten dewasa, penipuan, jasa joki tugas/ujian, jual beli akun, data pribadi, midtransmen palsu, produk bajakan, plagiarisme, dan barang atau jasa yang melanggar hukum Indonesia atau aturan kampus.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Larangan Upload Data Sensitif</h2>
            <p>Pengguna dilarang mengunggah KTP, kartu keluarga, data kesehatan, data keuangan, password, data login, rahasia dagang, midtransmen rahasia kampus, atau data pribadi orang lain tanpa izin. Jika data sensitif terunggah, pengguna wajib segera menghapusnya dan menghubungi support.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Aturan Penyalahgunaan AI</h2>
            <p>Fitur AI tidak boleh digunakan untuk menyontek ujian, membuat tugas yang diklaim sebagai karya sendiri tanpa proses belajar, plagiarisme, membuat konten berbahaya, manipulasi identitas, prompt injection, spam, penipuan, atau aktivitas yang melanggar hukum dan etika akademik. Output AI harus diperiksa kembali oleh pengguna.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Batas Tanggung Jawab NEXA</h2>
            <p>NEXA berusaha menyediakan layanan yang stabil dan bermanfaat, tetapi tidak menjamin akurasi penuh output AI, hasil akademik, kelulusan, transaksi marketplace, pengiriman notifikasi Telegram, atau ketersediaan layanan tanpa gangguan. NEXA tidak bertanggung jawab atas kerugian akibat keputusan pengguna, transaksi antar pengguna, atau konten yang dibuat pengguna.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Penghapusan Akun dan Midtransmen</h2>
            <p>Midtransmen dapat dihapus dari dashboard materi. Untuk penghapusan akun, hubungi support resmi dan sertakan email akun yang ingin dihapus. Penghapusan akun bersifat permanen dan menghapus seluruh data terkait termasuk profil, midtransmen, soal, sesi ujian, reminder, tim belajar, keanggotaan tim, chat PDF, dan listing marketplace.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Kontak Resmi Support</h2>
            <p>Kontak resmi NEXA adalah Telegram bot @NEXATchBot dan email nexatechlabs271@gmail.com. Gunakan kontak ini untuk support, aktivasi paket, paket kampus, checkout Midtrans, refund, dan penghapusan akun.</p>
          </section>

        </div>
      </article>
    </main>
  )
}
