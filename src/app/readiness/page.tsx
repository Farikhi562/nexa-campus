import Link from 'next/link'
import { AlertTriangle, CheckCircle2, KeyRound, ShieldCheck, Zap } from 'lucide-react'

const CHECKS = [
  { label: 'Supabase URL', ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), key: 'NEXT_PUBLIC_SUPABASE_URL' },
  { label: 'Supabase anon key', ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' },
  { label: 'Supabase service role', ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), key: 'SUPABASE_SERVICE_ROLE_KEY' },
  { label: 'OpenAI API key', ok: Boolean(process.env.OPENAI_API_KEY), key: 'OPENAI_API_KEY' },
  { label: 'OCR.space API key', ok: Boolean(process.env.OCR_SPACE_API_KEY), key: 'OCR_SPACE_API_KEY' },
  { label: 'Midtrans server key', ok: Boolean(process.env.MIDTRANS_SERVER_KEY), key: 'MIDTRANS_SERVER_KEY' },
  { label: 'Midtrans client key', ok: Boolean(process.env.MIDTRANS_CLIENT_KEY), key: 'MIDTRANS_CLIENT_KEY' },
  { label: 'Midtrans public client key', ok: Boolean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY), key: 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY' },
]

export default function ReadinessPage() {
  const readyCount = CHECKS.filter((item) => item.ok).length

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-brand-700">
          <Zap className="h-4 w-4" />
          NEXA Campus Ecosystem
        </Link>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Deployment Readiness</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Halaman internal ringan untuk memastikan environment utama sudah terpasang. Value secret tidak ditampilkan.
            </p>
          </div>
          <div className="rounded-lg bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Ready checks</p>
            <p className="mt-1 text-3xl font-black">{readyCount}/{CHECKS.length}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3">
          {CHECKS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {item.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-black">{item.label}</p>
                  <p className="text-xs font-semibold text-slate-500">{item.key}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${item.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {item.ok ? 'OK' : 'Belum diisi'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-5">
            <ShieldCheck className="h-6 w-6 text-brand-700" />
            <h2 className="mt-3 font-black">Sebelum dijual</h2>
            <p className="mt-2 text-sm leading-6 text-brand-900">
              Pastikan SQL + RLS sudah dijalankan di Supabase, Google OAuth redirect sudah benar, dan paket user bisa diaktifkan admin setelah Midtrans confirm.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <KeyRound className="h-6 w-6 text-slate-700" />
            <h2 className="mt-3 font-black">Jangan share halaman ini publik</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pakai hanya untuk cek deploy. Kalau sudah launch, route ini bisa diproteksi admin atau dihapus.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
