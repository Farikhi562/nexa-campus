import ManualPaymentCard from '@/components/billing/ManualPaymentCard'
import { BILLING_PLANS } from '@/lib/billing/plans'

export default function BillingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-600">NEXA Billing</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Upgrade plan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Untuk sementara pembayaran pakai manual payment. Midtrans libur dulu, karena bahkan payment gateway pun kadang butuh drama.
        </p>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="font-black text-slate-950">Harga aktif sementara</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {Object.values(BILLING_PLANS).map((plan) => (
            <div key={plan.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-black text-slate-950">{plan.name}</p>
              <p className="mt-1 text-2xl font-black text-teal-700">{plan.priceLabel}</p>
              <p className="text-xs font-bold text-slate-400">{plan.period}</p>
            </div>
          ))}
        </div>
      </div>

      <ManualPaymentCard />
    </main>
  )
}
