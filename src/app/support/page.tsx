import Link from 'next/link'
import { Bug, Database, LifeBuoy, Mail, ReceiptText } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import NexaLogo from '@/components/NexaLogo'

const supportEmail = 'support@nexatechlabs.my.id'

const actions = [
  {
    title: 'Minta hapus data',
    desc: 'Kirim request penghapusan data akun NEXA Campus.',
    href: `mailto:${supportEmail}?subject=Request%20hapus%20data%20NEXA%20Campus`,
    icon: Database,
  },
  {
    title: 'Laporkan bug',
    desc: 'Ada halaman error atau flow yang nyangkut? Kirim detailnya.',
    href: `mailto:${supportEmail}?subject=Bug%20report%20NEXA%20Campus`,
    icon: Bug,
  },
  {
    title: 'Ajukan upgrade manual',
    desc: 'Minta admin bantu proses upgrade Pulse atau Command.',
    href: '/dashboard/billing',
    icon: ReceiptText,
  },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <NexaLogo className="h-9 w-9" />
            <span className="font-black">NEXA Campus</span>
          </Link>
          <Link href="/privacy" className="text-sm font-black text-slate-600 hover:text-brand-700">
            Privacy
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <Badge tone="brand">Support beta</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950">
          Butuh bantuan? Kirim sinyal ke NEXA.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          Untuk MVP beta, support masih sederhana lewat email dan flow billing manual. Tidak ada chatbot palsu, tidak ada nomor ajaib.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {actions.map(({ title, desc, href, icon: Icon }) => (
            <Card key={title}>
              <CardContent>
                <Icon className="mb-4 h-5 w-5 text-brand-700" />
                <h2 className="font-black text-slate-950">{title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{desc}</p>
                <Link
                  href={href}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700"
                >
                  Buka
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Mail className="mb-4 h-5 w-5 text-brand-700" />
            <p className="font-black text-slate-950">Email support</p>
            <a className="mt-2 block text-sm font-bold text-brand-700" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <LifeBuoy className="mb-4 h-5 w-5 text-brand-700" />
            <p className="font-black text-slate-950">FAQ quick links</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
              <Link href="/#cara-kerja" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">Cara kerja</Link>
              <Link href="/pricing" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">Pricing</Link>
              <Link href="/privacy" className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">Privacy</Link>
            </div>
          </div>
        </div>

        {/* TODO: Replace mailto actions with server-validated support forms when the beta support backend is ready. */}
      </section>
    </main>
  )
}
