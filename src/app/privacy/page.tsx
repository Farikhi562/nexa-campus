import Link from 'next/link'
import { Database, LockKeyhole, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import NexaCampusLogo from '@/components/brand/NexaCampusLogo'
import Badge from '@/components/ui/Badge'
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
  {
    title: 'Batasan layanan',
    body: 'NEXA bukan sistem resmi kampus dan reminder dapat gagal karena provider, jaringan, atau gangguan sistem. Selalu cek kanal resmi kampus.',
    icon: ShieldCheck,
  },
  {
    title: 'Kontak support',
    body: 'Untuk bantuan, request hapus data, bug report, atau upgrade manual, gunakan halaman support NEXA Campus.',
    icon: Mail,
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <NexaCampusLogo imageClassName="h-9 w-9" />
          </Link>
          <Link href="/support" className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
            Support
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-4 py-10">
        <Badge tone="brand">Privacy-first MVP</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950">
          Privacy Policy yang jujur dan gampang dibaca.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          NEXA Campus dibangun dengan prinsip data minimum. Kami hanya menyimpan data yang dibutuhkan agar dashboard deadline dan reminder bisa bekerja.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map(({ title, body, icon: Icon }) => (
            <Card key={title}>
              <CardContent>
                <Icon className="mb-4 h-5 w-5 text-brand-700" />
                <h2 className="font-black text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus sebelum mengambil keputusan akademik.
        </div>
      </article>
    </main>
  )
}
