import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold text-brand-700">NEXA Campus Ecosystem</Link>
        <h1 className="mt-4 text-4xl font-black">Syarat Penggunaan</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Terakhir diperbarui: 29 Mei 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <p>NEXA adalah platform belajar, reminder, study room, dan marketplace kampus. Pengguna bertanggung jawab atas konten yang diunggah dan listing yang dibuat.</p>
          <p>Akun Free dapat mencoba fitur dasar. Akun Basic dan Pro membuka fitur berbayar seperti seller marketplace, tool lanjutan, dan reminder otomatis sesuai paket.</p>
          <p>Transaksi marketplace dilakukan antar pengguna. NEXA menyediakan sarana listing dan kontak, tetapi pengguna tetap wajib bertransaksi secara aman dan jujur.</p>
          <p>Pembayaran paket dilakukan melalui Midtrans atau alur admin resmi. Paket dapat diaktifkan setelah pembayaran terkonfirmasi.</p>
        </div>
      </article>
    </main>
  )
}
