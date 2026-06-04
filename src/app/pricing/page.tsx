import Link from 'next/link'
import { ArrowRight, CheckCircle2, LockKeyhole, ReceiptText, ShieldCheck } from 'lucide-react'
import NexaCampusLogo from '@/components/brand/NexaCampusLogo'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { BRAND } from '@/lib/brand'
import { PLANS } from '@/lib/nexa-data'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <NexaCampusLogo imageClassName="h-9 w-9" />
          </Link>
          <Link href="/login?mode=signup" className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-black text-white hover:bg-brand-700">
            Daftar
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="max-w-3xl">
          <Badge tone="brand">MVP beta pricing</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Pilih seberapa keras deadline perlu ngejar kamu.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Mulai gratis dengan Radar. Kalau butuh reminder dan kontrol lebih lengkap, upgrade dilakukan manual dulu agar beta tetap aman dan realistis.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden ${plan.highlighted ? 'border-brand-300 ring-2 ring-brand-100' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute right-4 top-4">
                  <Badge tone="brand">Beta favorite</Badge>
                </div>
              )}
              <CardContent className="p-5">
                <h2 className="pr-24 text-lg font-black text-slate-950">{plan.name}</h2>
                <p className="mt-1 min-h-12 text-sm leading-6 text-slate-500">{plan.positioning}</p>
                <p className="mt-5 text-3xl font-black text-slate-950">
                  {plan.price}
                  <span className="text-sm font-semibold text-slate-500">{plan.suffix}</span>
                </p>
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
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    plan.highlighted
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.id === 'radar' ? 'Mulai Radar' : 'Ajukan Upgrade Manual'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <ReceiptText className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>
              Payment gateway belum aktif. Untuk MVP beta, upgrade dilakukan melalui request manual dan konfirmasi admin.
            </p>
          </div>
          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
            <LockKeyhole className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
            <p>AI Quick Add dan Ask NEXA masih locked preview. Belum ada klaim fitur live.</p>
          </div>
        </div>

        <div className="mt-4 flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
          <p>{BRAND.disclaimer}</p>
        </div>
      </section>
    </main>
  )
}
