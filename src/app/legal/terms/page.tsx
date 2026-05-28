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
            <p>NEXA adalah platform belajar, reminder, study room, dan marketplace kampus. Pengguna bertanggung jawab atas konten yang diunggah, hasil penggunaan fitur AI, dan listing yang dibuat.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Paket dan Pembayaran</h2>
            <p>Akun Free dapat mencoba fitur dasar. Akun Basic dan Pro membuka fitur berbayar seperti seller marketplace, tool lanjutan, dan reminder otomatis sesuai paket. Pembayaran paket dilakukan melalui Midtrans atau alur admin resmi. Paket dapat diaktifkan setelah pembayaran terkonfirmasi.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Refund Policy</h2>
            <p>Refund dapat diajukan maksimal 3 hari setelah pembayaran jika paket belum aktif, terjadi pembayaran ganda, atau fitur utama tidak dapat digunakan karena kesalahan sistem NEXA. Refund tidak berlaku untuk penyalahgunaan akun, pelanggaran aturan, atau pembelian yang sudah digunakan secara wajar. Pengajuan refund dilakukan melalui WhatsApp admin 085697916845 atau email nexatechlabs271@gmail.com.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Marketplace dan Konten Terlarang</h2>
            <p>Transaksi marketplace dilakukan antar pengguna. NEXA menyediakan sarana listing dan kontak, tetapi pengguna tetap wajib bertransaksi secara aman dan jujur. Konten terlarang meliputi barang ilegal, narkotika, senjata, alkohol, rokok/vape untuk minor, konten dewasa, penipuan, jasa joki tugas/ujian, jual beli akun, data pribadi, dokumen palsu, produk bajakan, plagiarisme, dan barang atau jasa yang melanggar hukum Indonesia atau aturan kampus.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Larangan Upload Data Sensitif</h2>
            <p>Pengguna dilarang mengunggah KTP, kartu keluarga, data kesehatan, data keuangan, password, data login, rahasia dagang, dokumen rahasia kampus, atau data pribadi orang lain tanpa izin. Jika data sensitif terunggah, pengguna wajib segera menghapusnya dan menghubungi support.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Aturan Penyalahgunaan AI</h2>
            <p>Fitur AI tidak boleh digunakan untuk menyontek ujian, membuat tugas yang diklaim sebagai karya sendiri tanpa proses belajar, plagiarisme, membuat konten berbahaya, manipulasi identitas, spam, penipuan, atau aktivitas yang melanggar hukum dan etika akademik. Output AI harus diperiksa kembali oleh pengguna.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Batas Tanggung Jawab NEXA</h2>
            <p>NEXA berusaha menyediakan layanan yang stabil dan bermanfaat, tetapi tidak menjamin akurasi penuh output AI, hasil akademik, kelulusan, transaksi marketplace, atau ketersediaan layanan tanpa gangguan. NEXA tidak bertanggung jawab atas kerugian akibat keputusan pengguna, transaksi antar pengguna, atau konten yang dibuat pengguna.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Penghapusan Akun dan Dokumen</h2>
            <p>Dokumen dapat dihapus dari dashboard materi. Untuk penghapusan akun, hubungi support resmi dan sertakan email akun yang ingin dihapus. Penghapusan akun dapat menghilangkan profil, dokumen, soal, sesi ujian, marketplace listing, dan data terkait lain.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Kontak Resmi Support</h2>
            <p>Kontak resmi NEXA adalah WhatsApp admin 085697916845 dan email nexatechlabs271@gmail.com. Gunakan kontak ini untuk support, aktivasi paket, paket kampus, checkout Midtrans, refund, dan penghapusan akun.</p>
          </section>
        </div>
      </article>
    </main>
  )
}
