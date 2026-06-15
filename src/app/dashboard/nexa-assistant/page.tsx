import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bot, Crown, LockKeyhole, Sparkles, Zap } from 'lucide-react'
import NexaCommandAssistantPage from '@/components/ai/NexaCommandAssistantPage'
import { createClient } from '@/lib/supabase/server'
import { getUserPlanAccess } from '@/lib/billing/server'
import { BILLING_PLANS } from '@/lib/billing/plans'

type DeadlineRow = {
  id?: string | number
  title?: string | null
  course_name?: string | null
  course?: string | null
  type?: string | null
  source?: string | null
  deadline_date?: string | null
  due_date?: string | null
  deadline_time?: string | null
  due_time?: string | null
  priority?: string | null
  status?: string | null
  reminder_enabled?: boolean | null
  created_at?: string | null
}

type ProfilePayload = {
  id?: string | null
  user_id?: string | null
  full_name?: string | null
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  nexa_id?: string | null
  plan?: string | null
  plan_status?: string | null
  plan_expires_at?: string | null
}

function normalizeDeadline(row: DeadlineRow) {
  return {
    id: row.id,
    title: row.title ?? null,
    course_name: row.course_name ?? row.course ?? null,
    type: row.type ?? null,
    source: row.source ?? null,
    deadline_date: row.deadline_date ?? row.due_date ?? null,
    deadline_time: row.deadline_time ?? row.due_time ?? null,
    priority: row.priority ?? null,
    status: row.status ?? null,
    reminder_enabled: Boolean(row.reminder_enabled),
    created_at: row.created_at ?? null,
  }
}

function UpgradeToCommand({ currentPlan }: { currentPlan: string }) {
  const command = BILLING_PLANS.command

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-teal-950/30 sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-teal-200">
            <LockKeyhole className="h-3.5 w-3.5" /> Command only
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            NEXA Assistant Command Center
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Halaman ini sengaja dikunci buat NEXA Command. Ini bukan chatbot biasa yang jawab “semangat ya” lalu kabur. Mode ini buat bikin battle plan deadline, risk scan, reminder custom, sampe strategi Arena
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['AI Autopilot', 'Bikin prioritas + jadwal eksekusi'],
              ['Risk Scanner', 'Deteksi deadline yang rawan kebakar'],
              ['Reminder Architect', 'Rancang H-7/H-3/H-1/jam custom'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <div className="text-sm font-black text-white">{title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-950/40 transition hover:bg-teal-300"
            >
              <Crown className="h-4 w-4" /> Upgrade ke {command.name} {command.priceLabel}
            </Link>
            <Link
              href="/pricing/scope"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Lihat batasan plan
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-teal-300/20 bg-gradient-to-br from-teal-400/15 to-fuchsia-400/10 p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-teal-400 text-slate-950">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-black text-teal-100">Plan kamu sekarang</div>
              <div className="text-2xl font-black capitalize">{currentPlan}</div>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-200">
            {[
              'Radar/Pulse tetep bisa pake Assistant basic sesuai limit',
              'Command unlock action mode: save deadline, summary, risk score, notification copy, dan strategi belajar',
              'Fitur ini dibuat premium karena AI cost itu pake duit',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-slate-950/35 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 flex-none text-teal-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default async function NexaAssistantCommandRoute() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard/nexa-assistant')
  }

  const access = await getUserPlanAccess({ supabase, user: { id: user.id, email: user.email } })
  const profile = (access?.profile ?? null) as ProfilePayload | null
  const currentPlan = access?.plan ?? 'radar'

  if (currentPlan !== 'command') {
    return <UpgradeToCommand currentPlan={currentPlan} />
  }

  const { data: deadlines } = await supabase
    .from('academic_deadlines')
    .select('id,title,course_name,type,source,deadline_date,deadline_time,priority,status,reminder_enabled,created_at')
    .eq('user_id', user.id)
    .order('deadline_date', { ascending: true })
    .limit(60)

  return (
    <NexaCommandAssistantPage
      profile={{
        full_name: profile?.full_name ?? profile?.name ?? user.email ?? 'Command User',
        email: profile?.email ?? user.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        nexa_id: profile?.nexa_id ?? null,
        plan: currentPlan,
      }}
      deadlines={Array.isArray(deadlines) ? deadlines.map((row) => normalizeDeadline(row as DeadlineRow)) : []}
    />
  )
}
