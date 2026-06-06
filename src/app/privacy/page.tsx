import { Database, LockKeyhole, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import PublicPageShell from '@/components/layout/PublicPageShell'
import { Card, CardContent } from '@/components/ui/Card'

const sections = [
  {
    title: 'Data yang kami simpan',
    body: 'NEXA menyimpan profil dasar user, deadline akademik yang user input sendiri, kontak reminder opsional, dan status paket/subscription intent.',
    icon: Database,
  },
  {
    title: 'Data yang tidak kami minta',
    body: 'NEXA tidak meminta atau menyimpan password VClass, iLab, Studentsite, NPM, email kampus, atau platform kampus lain.',
    icon: LockKeyhole,
  },
  {
    title: 'Cara data digunakan',
    body: 'Data dipakai untuk menampilkan dashboard deadline, menghitung urgensi, menyimpan preferensi reminder, dan memproses request upgrade manual.',
    icon: ShieldCheck,
  },
  {
    title: 'Reminder Telegram/WhatsApp',
    body: 'Telegram disiapkan untuk testing reminder. WhatsApp via Wablas adalah roadmap produksi. Kontak hanya disimpan jika user memilih memakai reminder.',
    icon: Mail,
  },
  {
    title: 'Keamanan database dan Row Level Security',
    body: 'Database dirancang dengan Supabase RLS agar user hanya dapat membaca dan mengubah data miliknya sendiri. Service role key tidak dipakai di client.',
    icon: ShieldCheck,
  },
  {
    title: 'Penghapusan data',
    body: 'User dapat meminta penghapusan data melalui halaman support. Kami akan memproses request sesuai kemampuan operasional MVP beta.',
    icon: Trash2,
  },
]

export default function PrivacyPage() {
  return (
    <PublicPageShell
      badge="Privacy-first MVP"
      title="Privacy Policy yang jujur dan gampang dibaca."
      description="NEXA Campus dibangun dengan prinsip data minimum. Kami hanya menyimpan data yang dibutuhkan agar dashboard deadline dan reminder bisa bekerja."
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
        NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus sebelum mengambil keputusan akademik.
      </div>
    </PublicPageShell>
  )
}
