import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold text-brand-700">NEXA Campus Ecosystem</Link>
        <h1 className="mt-4 text-4xl font-black">Kebijakan Privasi</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Terakhir diperbarui: 29 Mei 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <p>NEXA mengumpulkan data akun, profil, dokumen belajar, jadwal, marketplace, dan aktivitas belajar yang diperlukan untuk menjalankan layanan.</p>
          <p>Dokumen yang diunggah dipakai untuk memproses ringkasan, soal, dan fitur belajar. Jangan unggah dokumen yang melanggar hak cipta atau berisi data sensitif orang lain.</p>
          <p>Pembayaran diproses melalui DOKU atau proses operasional admin. NEXA tidak menyimpan data kartu pembayaran di aplikasi.</p>
          <p>Pengguna dapat meminta bantuan perubahan data, penghapusan akun, atau aktivasi paket melalui halaman kontak.</p>
        </div>
      </article>
    </main>
  )
}
