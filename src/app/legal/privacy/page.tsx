import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold text-brand-700">{BRAND.productName}</Link>
        <h1 className="mt-4 text-4xl font-black">Kebijakan Privasi</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Terakhir diperbarui: 29 Mei 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Data yang Dikumpulkan</h2>
            <p>{BRAND.companyName} mengumpulkan data akun untuk menjalankan {BRAND.productName}: email, profil akademik (nama, jurusan, universitas, provinsi), Dokumen belajar, jadwal ujian, reminder, aktivitas marketplace, hasil exam, streak belajar, badge pencapaian, data tim belajar, notifikasi in-app, log error anonim, dan data teknis yang diperlukan untuk menjalankan layanan.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Dokumen dan Pemrosesan AI</h2>
            <p>Dokumen yang diunggah digunakan untuk memproses ekstraksi teks, ringkasan otomatis, pembuatan soal latihan, dan fitur Chat with PDF. Teks hasil ekstraksi disimpan di database untuk memungkinkan fitur AI berjalan tanpa perlu memproses ulang Dokumen. Pemrosesan AI dilakukan menggunakan {BRAND.aiProvider}. Pengguna dilarang mengunggah data sensitif seperti KTP, kartu keluarga, data kesehatan, data keuangan, password, rahasia dagang, Dokumen yang melanggar hak cipta, atau data pribadi orang lain tanpa izin.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Integrasi Telegram</h2>
            <p>Untuk fitur Smart Reminder otomatis (paket Pro), pengguna dapat menghubungkan akun Telegram mereka. {BRAND.productName} menyimpan Telegram Chat ID pengguna setelah verifikasi melalui bot resmi @NEXATchBot. Chat ID hanya digunakan untuk mengirim notifikasi reminder dan laporan performa mingguan. {BRAND.companyName} tidak membaca, menyimpan, atau mengakses pesan Telegram pengguna di luar proses verifikasi.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Data Tim dan Kolaborasi</h2>
            <p>Saat pengguna bergabung atau membuat tim belajar, nama dan profil publik mereka dapat dilihat oleh anggota tim yang sama. Pesan dalam chat tim disimpan di database {BRAND.productName}. Dokumen yang dibagikan ke tim dapat diakses oleh seluruh anggota tim selama izin berbagi aktif. Pengguna dapat keluar dari tim kapan saja melalui pengaturan tim.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Leaderboard dan Profil Publik</h2>
            <p>Pengguna yang mengaktifkan profil publik (default: aktif) dapat muncul di leaderboard kampus dan nasional dengan menampilkan nama, universitas, rata-rata skor, dan streak. Pengguna dapat menonaktifkan profil publik kapan saja melalui pengaturan akun, dan data mereka akan hilang dari leaderboard.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Pembayaran</h2>
            <p>Pembayaran diproses melalui {BRAND.paymentProvider} atau proses operasional admin. {BRAND.productName} tidak menyimpan data kartu pembayaran di aplikasi. Data transaksi disimpan untuk keperluan verifikasi aktivasi paket dan pengajuan refund.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Log Error dan Keamanan</h2>
            <p>{BRAND.companyName} menyimpan log error anonim untuk keperluan debugging dan peningkatan layanan. Log ini mencatat jenis error dan waktu kejadian, tanpa menyimpan isi Dokumen, jawaban ujian, atau informasi sensitif pengguna. Rate limiting diterapkan pada semua endpoint API untuk melindungi layanan dari penyalahgunaan.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Cara Hapus Dokumen</h2>
            <p>Pengguna dapat menghapus Dokumen dari dashboard materi. Penghapusan Dokumen juga menghapus teks hasil ekstraksi, ringkasan AI, soal yang dibuat dari Dokumen tersebut, sesi ujian terkait, dan history chat PDF yang berhubungan.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Cara Hapus Akun</h2>
            <p>Untuk meminta penghapusan akun, hubungi support resmi melalui Telegram admin 085697916845 atau email nexatechlabs271@gmail.com dengan subjek &quot;Hapus Akun NEXA&quot;. Tim akan memverifikasi kepemilikan akun sebelum memproses penghapusan. Penghapusan akun bersifat permanen dan menghapus seluruh data terkait termasuk Dokumen, soal, sesi ujian, reminder, listing marketplace, keanggotaan tim, dan profil.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-black text-slate-950">Kontak Resmi Support</h2>
            <p>Kontak resmi {BRAND.companyName} adalah Telegram bot @NEXATchBot, email nexatechlabs271@gmail.com, dan domain {BRAND.domain}. Gunakan kontak ini untuk bantuan akun, data, aktivasi paket, permintaan privasi, dan penghapusan akun.</p>
          </section>

        </div>
      </article>
    </main>
  )
}
