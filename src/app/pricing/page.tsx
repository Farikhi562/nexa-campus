import Link from 'next/link'
import { BILLING_PLANS } from '@/lib/billing/plans'

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-600">Pricing</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950">Pilih mode NEXA lo</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Radar gratis, Pulse Rp18.000, Command Rp30.000. Midtrans belum dipakai dulu, jadi checkout diarahkan ke manual payment.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {Object.values(BILLING_PLANS).map((plan) => (
          <div key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">{plan.name}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{plan.description}</p>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-3xl font-black text-slate-950">{plan.priceLabel}</span>
              <span className="pb-1 text-sm font-bold text-slate-400">/{plan.period}</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
            {plan.id === 'radar' ? (
              <Link href="/dashboard" className="mt-6 inline-flex w-full justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">
                Masuk Dashboard
              </Link>
            ) : (
              <Link href="/dashboard/billing" className="mt-6 inline-flex w-full justify-center rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700">
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
