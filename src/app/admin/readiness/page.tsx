import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Database, KeyRound, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

type EnvItem = {
  label: string
  ok: boolean
  note: string
}

function EnvStatus({ label, ok, note }: EnvItem) {
  return (
    <div className={`rounded-3xl border p-4 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{note}</p>
        </div>
        <Badge tone={ok ? 'success' : 'danger'}>{ok ? 'Ready' : 'Missing'}</Badge>
      </div>
    </div>
  )
}

type StatItem = {
  label: string
  value: number
  icon: LucideIcon
}

export default async function AdminReadinessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminEmails = getAdminEmails()
  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect('/dashboard')
  }

  const [{ count: userCount }, { count: deadlineCount }, { count: intentCount }, { count: referralCount }] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }),
      supabase.from('subscription_intents').select('id', { count: 'exact', head: true }),
      supabase.from('referrals').select('id', { count: 'exact', head: true }),
    ])

  const stats: StatItem[] = [
    { label: 'Users', value: userCount ?? 0, icon: UsersRound },
    { label: 'Deadlines', value: deadlineCount ?? 0, icon: Database },
    { label: 'Upgrade intents', value: intentCount ?? 0, icon: KeyRound },
    { label: 'Referrals', value: referralCount ?? 0, icon: CheckCircle2 },
  ]

  const envs: EnvItem[] = [
    { label: 'Supabase URL', ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), note: 'Auth dan database client.' },
    { label: 'Supabase Anon Key', ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), note: 'Client auth Supabase.' },
    { label: 'Service Role Key', ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), note: 'Admin action dan referral reward.' },
    { label: 'Telegram Bot Token', ok: Boolean(process.env.TELEGRAM_BOT_TOKEN), note: 'Test Telegram dan reminder worker.' },
    { label: 'Gemini API Key', ok: Boolean(process.env.GEMINI_API_KEY), note: 'AI Quick Add beta.' },
    { label: 'Cron Secret', ok: Boolean(process.env.CRON_SECRET), note: 'Proteksi endpoint cron.' },
    { label: 'Admin Emails', ok: adminEmails.length > 0, note: 'Akses admin panel.' },
  ]

  const readyCount = envs.filter((item) => item.ok).length

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="border-b border-slate-900 bg-slate-950 text-white">
        <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(45,212,191,0.24),transparent_24rem)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Production Readiness
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                Cek sistem sebelum NEXA dibuka lebih luas.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Status env, integrasi, dan data dasar dalam satu layar. Kalau ada missing, jangan dipaksa viral dulu.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <p className="text-4xl font-black text-white">{readyCount}/{envs.length}</p>
              <p className="mt-1 text-sm font-bold text-slate-300">env ready</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:py-6">
        <div className="flex justify-end">
          <Link href="/admin" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
            Admin Panel
          </Link>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-slate-200 bg-white">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{label}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-teal-200">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-slate-200 bg-white">
          <CardContent>
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <h2 className="font-black text-slate-950">Environment checklist</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Missing bukan berarti app mati total, tapi fitur terkait bisa gagal di production.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {envs.map((item) => <EnvStatus key={item.label} {...item} />)}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
