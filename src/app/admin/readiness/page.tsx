import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Database, KeyRound, UsersRound, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function EnvStatus({ label, ok, note }: { label: string; ok: boolean; note: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="font-black text-slate-950">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
      </div>
      <Badge tone={ok ? 'success' : 'danger'}>{ok ? 'Ready' : 'Missing'}</Badge>
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

  const envs = [
    {
      label: 'Supabase URL',
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      note: 'Dipakai untuk auth dan database.',
    },
    {
      label: 'Supabase Anon Key',
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      note: 'Dipakai client auth Supabase.',
    },
    {
      label: 'Service Role Key',
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      note: 'Dibutuhkan untuk admin action, referral reward, dan upload foto.',
    },
    {
      label: 'Telegram Bot Token',
      ok: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      note: 'Dibutuhkan untuk test Telegram dan reminder worker.',
    },
    {
      label: 'Gemini API Key',
      ok: Boolean(process.env.GEMINI_API_KEY),
      note: 'Dibutuhkan untuk AI Quick Add.',
    },
    {
      label: 'Cron Secret',
      ok: Boolean(process.env.CRON_SECRET),
      note: 'Dibutuhkan untuk mengamankan endpoint reminder cron.',
    },
    {
      label: 'Admin Emails',
      ok: adminEmails.length > 0,
      note: 'Dibutuhkan untuk akses admin panel.',
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Production Readiness</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Cek sebelum share beta.</h1>
            <p className="mt-2 text-sm text-slate-500">Checklist environment dan data dasar NEXA Campus.</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
            Admin Panel
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon: LucideIcon = stat.icon

            return (
              <Card key={stat.label}>
                <CardContent>
                  <Icon className="mb-4 h-5 w-5 text-brand-700" />
                  <p className="text-3xl font-black text-slate-950">{stat.value}</p>
                  <p className="mt-1 text-sm font-bold text-slate-600">{stat.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <Card>
          <CardContent>
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <h2 className="font-black text-slate-950">Environment checklist</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Kalau ada yang Missing, fitur terkait bisa gagal di production.
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
