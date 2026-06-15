import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bot, CalendarPlus, Crown, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react'
import AskNexaPanel from '@/components/ai/AskNexaPanel'
import NexaCommandAssistantPage from '@/components/ai/NexaCommandAssistantPage'
import { createClient } from '@/lib/supabase/server'
import { getUserPlanAccess } from '@/lib/billing/server'
import { BILLING_PLANS } from '@/lib/billing/plans'
import type { AcademicDeadline } from '@/types'

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

type NormalizedDeadline = ReturnType<typeof normalizeDeadline>

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

function BasicAssistantPage({
  currentPlan,
  profile,
  deadlines,
}: {
  currentPlan: string
  profile: {
    full_name?: string | null
    avatar_url?: string | null
    nexa_id?: string | null
  }
  deadlines: NormalizedDeadline[]
}) {
  const command = BILLING_PLANS.command
  const pulse = BILLING_PLANS.pulse

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.58fr)]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/20 sm:p-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-teal-100">
              <Bot className="h-3.5 w-3.5" /> NEXA Assistant aktif
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Assistant yang bisa dipakai, bukan sekadar preview.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Chat untuk ringkas deadline, susun prioritas, bikin rencana belajar, dan membaca perintah deadline dari kalimat bebas. Radar bisa chat basic, Pulse bisa simpan deadline dari AI, Command membuka mode aksi penuh.
            </p>
          </div>

          <AskNexaPanel
            deadlines={deadlines as unknown as AcademicDeadline[]}
            userProfile={{
              full_name: profile.full_name ?? null,
              avatar_url: profile.avatar_url ?? null,
              nexa_id: profile.nexa_id ?? null,
            }}
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Plan aktif</div>
                <div className="text-xl font-black capitalize text-slate-950">{currentPlan}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
              <div className="flex gap-2"><ShieldCheck className="mt-1 h-4 w-4 flex-none text-teal-600" /> Radar: chat assistant basic sesuai limit harian.</div>
              <div className="flex gap-2"><CalendarPlus className="mt-1 h-4 w-4 flex-none text-teal-600" /> Pulse: AI bisa parse dan simpan deadline.</div>
              <div className="flex gap-2"><Crown className="mt-1 h-4 w-4 flex-none text-amber-600" /> Command: briefing, risk scan, reminder architect, dan Arena coach.</div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-amber-900">
              <Sparkles className="h-4 w-4" /> Mau mode Command?
            </div>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              Upgrade kalau kamu butuh assistant yang bisa bikin briefing taktis, risk scan, reminder custom, copy notifikasi, dan strategi Arena.
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-200/80 transition hover:bg-amber-300"
            >
              <Crown className="h-4 w-4" /> Upgrade ke {command.name} {command.priceLabel}
            </Link>
            {currentPlan === 'radar' && (
              <Link
                href="/dashboard/billing"
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100"
              >
                Lihat {pulse.name} {pulse.priceLabel}
              </Link>
            )}
            <Link
              href="/pricing/scope"
              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-amber-100"
            >
              Lihat batasan plan
            </Link>
          </div>
        </aside>
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

  const { data: deadlines } = await supabase
    .from('academic_deadlines')
    .select('id,title,course_name,type,source,deadline_date,deadline_time,priority,status,reminder_enabled,created_at')
    .eq('user_id', user.id)
    .order('deadline_date', { ascending: true })
    .limit(60)

  const normalizedDeadlines = Array.isArray(deadlines)
    ? deadlines.map((row) => normalizeDeadline(row as DeadlineRow))
    : []

  if (currentPlan !== 'command') {
    return (
      <BasicAssistantPage
        currentPlan={currentPlan}
        profile={{
          full_name: profile?.full_name ?? profile?.name ?? user.email ?? 'User NEXA',
          avatar_url: profile?.avatar_url ?? null,
          nexa_id: profile?.nexa_id ?? null,
        }}
        deadlines={normalizedDeadlines}
      />
    )
  }

  return (
    <NexaCommandAssistantPage
      profile={{
        full_name: profile?.full_name ?? profile?.name ?? user.email ?? 'Command User',
        email: profile?.email ?? user.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        nexa_id: profile?.nexa_id ?? null,
        plan: currentPlan,
      }}
      deadlines={normalizedDeadlines}
    />
  )
}
