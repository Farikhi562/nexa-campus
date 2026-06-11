import { Database, LockKeyhole, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import PublicPageShell from '@/components/layout/PublicPageShell'
import { Card, CardContent } from '@/components/ui/Card'

const sections = [
  {
    title: 'Data yang kami simpan',
    body: 'NEXA menyimpan profil dasar, deadline akademik yang kamu masukkan sendiri, kontak reminder opsional, dan status paket.',
    icon: Database,
  },
  {
    title: 'Data yang tidak kami minta',
    body: 'NEXA tidak meminta atau menyimpan password VClass, iLab, Studentsite, NPM, email kampus, atau akun kampus lain.',
    icon: LockKeyhole,
  },
  {
    title: 'Cara data digunakan',
    body: 'Data dipakai untuk menampilkan dashboard, menghitung urgensi deadline, menyimpan preferensi reminder, dan memproses upgrade.',
    icon: ShieldCheck,
  },
  {
    title: 'Reminder Telegram/WhatsApp',
    body: 'Telegram digunakan untuk tahap awal reminder. WhatsApp akan dipertimbangkan setelah sistem utama stabil. Kontak hanya disimpan jika kamu memilih memakai reminder.',
    icon: Mail,
  },
  {
    title: 'Keamanan database dan Row Level Security',
    body: 'Database memakai Supabase RLS agar setiap pengguna hanya bisa membaca dan mengubah datanya sendiri. Service role key tidak dipakai di sisi client.',
    icon: ShieldCheck,
  },
  {
    title: 'Penghapusan data',
    body: 'Kamu dapat meminta penghapusan data lewat halaman support. Request akan diproses sesuai alur operasional yang tersedia.',
    icon: Trash2,
  },
]

export default function PrivacyPage() {
  return (
    <PublicPageShell
      badge="Privasi NEXA Campus"
      title="Kebijakan privasi yang dibuat sesederhana mungkin."
      description="NEXA Campus hanya menyimpan data yang dibutuhkan agar dashboard deadline dan reminder bisa berjalan."
      primaryCta={{ label: 'Hubungi Support', href: '/support' }}
      secondaryCta={{ label: 'Lihat Terms', href: '/terms' }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(({ title, body, icon: Icon }) => (
          <Card key={title} className="border-slate-200 bg-white">
            <CardContent>
              <Icon className="mb-4 h-5 w-5 text-brand-700" />
              <h2 className="font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        NEXA Campus bukan sistem resmi kampus. Tetap cek informasi final lewat kanal resmi kampus sebelum mengambil keputusan akademik.
      </div>
    </PublicPageShell>
  )
}
