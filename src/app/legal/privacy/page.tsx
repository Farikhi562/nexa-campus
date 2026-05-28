import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold text-brand-700">NEXA Campus Ecosystem</Link>
        <h1 className="mt-4 text-4xl font-black">Kebijakan Privasi</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Terakhir diperbarui: 29 Mei 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Data yang Dikumpulkan</h2>
            <p>NEXA mengumpulkan data akun, email, profil, dokumen belajar, jadwal, marketplace, aktivitas belajar, dan data teknis yang diperlukan untuk menjalankan layanan.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Dokumen dan Data Sensitif</h2>
            <p>Dokumen yang diunggah dipakai untuk memproses ringkasan, soal, dan fitur belajar. Pengguna dilarang mengunggah data sensitif seperti KTP, kartu keluarga, data kesehatan, data keuangan, password, rahasia dagang, dokumen yang melanggar hak cipta, atau data pribadi orang lain tanpa izin.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Pembayaran</h2>
            <p>Pembayaran diproses melalui Midtrans atau proses operasional admin. NEXA tidak menyimpan data kartu pembayaran di aplikasi.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Cara Hapus Dokumen</h2>
            <p>Pengguna dapat menghapus dokumen dari dashboard materi. Penghapusan dokumen dapat ikut menghapus soal, sesi ujian, dan data belajar yang terkait dengan dokumen tersebut.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Cara Hapus Akun</h2>
            <p>Untuk meminta penghapusan akun, hubungi support resmi melalui WhatsApp admin 085697916845 atau email nexatechlabs271@gmail.com dengan subjek &quot;Hapus Akun NEXA&quot;. Tim akan memverifikasi kepemilikan akun sebelum memproses penghapusan.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Kontak Resmi Support</h2>
            <p>Kontak resmi NEXA adalah WhatsApp 085697916845 dan email nexatechlabs271@gmail.com. Gunakan kontak ini untuk bantuan akun, data, aktivasi paket, dan permintaan privasi.</p>
          </section>
        </div>
      </article>
    </main>
  )
}
