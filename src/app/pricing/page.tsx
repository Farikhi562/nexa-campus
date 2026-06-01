import Link from 'next/link'
import { CheckCircle2, LockKeyhole } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import NexaLogo from '@/components/NexaLogo'
import { BRAND } from '@/lib/brand'
import { PLANS } from '@/lib/nexa-data'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <NexaLogo className="h-9 w-9" />
            <span className="font-black">NEXA Campus</span>
          </Link>
          <Link href="/login?mode=signup" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
            Daftar
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Badge tone="brand">Pricing beta</Badge>
        <h1 className="mt-4 max-w-2xl text-4xl font-black text-slate-950">Pilih seberapa keras deadline perlu ngejar kamu.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          Payment gateway belum diaktifkan. Untuk MVP, upgrade dilakukan lewat manual transfer/QRIS dan admin confirm manual.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={plan.highlighted ? 'border-brand-300 ring-2 ring-brand-100' : ''}>
              <CardContent>
                <h2 className="text-lg font-black text-slate-950">{plan.name}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{plan.positioning}</p>
                <p className="mt-5 text-3xl font-black text-slate-950">{plan.price}<span className="text-sm font-semibold text-slate-500">{plan.suffix}</span></p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm leading-5 text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.id === 'radar' ? '/login?mode=signup' : '/dashboard/billing'}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-bold ${
                    plan.highlighted ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.id === 'radar' ? 'Mulai Radar' : 'Ajukan Upgrade'}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <LockKeyhole className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
          <p>AI Quick Add dan Ask NEXA masih locked preview. Copy-nya jujur: fitur ini roadmap, bukan klaim sudah jalan. {BRAND.disclaimer}</p>
        </div>
      </section>
    </main>
  )
}
