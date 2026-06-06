import Link from 'next/link'
import { CheckCircle2, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import NexaLogo from '@/components/NexaLogo'
import { BRAND } from '@/lib/brand'

const shipped = [
  'Google OAuth login',
  'Onboarding profil mahasiswa',
  'Deadline dashboard overview',
  'Tambah, edit, delete, dan quick complete deadline',
  'AI Quick Add beta untuk Pulse dan Command',
  'Telegram reminder settings dan test message',
  'Referral link dan reward Pulse trial',
  'Profile settings dengan upload foto',
  'Admin beta panel dan production readiness check',
  'Mobile install prompt',
]

const betaNotes = [
  'NEXA Campus bukan sistem resmi kampus.',
  'Deadline masih dicatat manual oleh user.',
  'Telegram reminder butuh scheduler/cron agar berjalan otomatis.',
  'AI Quick Add bersifat beta dan hasilnya tetap harus dicek user.',
  'Payment gateway belum aktif, upgrade masih manual via admin.',
]

export default function ReleaseNotesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <NexaLogo className="h-9 w-9" />
            <div>
              <span className="block font-black leading-4">NEXA Campus</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                v{BRAND.version}
              </span>
            </div>
          </Link>
          <Link href="/dashboard" className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <Badge tone="brand">Release v{BRAND.version}</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950">
          NEXA Campus MVP beta sudah siap diuji kecil-kecilan.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          Versi ini fokus ke satu janji utama: bantu mahasiswa mencatat, melihat, dan mengingat deadline akademik tanpa meminta password kampus.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardContent>
              <Rocket className="mb-4 h-5 w-5 text-brand-700" />
              <h2 className="text-lg font-black text-slate-950">Fitur yang sudah masuk</h2>
              <ul className="mt-4 space-y-3">
                {shipped.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <ShieldCheck className="mb-4 h-5 w-5 text-brand-700" />
              <h2 className="text-lg font-black text-slate-950">Catatan beta yang jujur</h2>
              <ul className="mt-4 space-y-3">
                {betaNotes.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
