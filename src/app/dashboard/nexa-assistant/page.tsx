import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bot, Lock, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import NexaAssistantCommand from '@/components/ai/NexaAssistantCommand'
import type { AcademicDeadline } from '@/types'

export const metadata = {
  title: 'NEXA Assistant — NEXA Campus',
}

export default async function NexaAssistantPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'full_name, campus_name, plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command'
    )
    .eq('id', user.id)
    .maybeSingle()

  const plan = getEffectivePlan({ ...(profile ?? {}), email: user.email })

  // Gate: hanya NEXA Command.
  if (plan !== 'command') {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/50 p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-amber-950">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-950">NEXA Assistant khusus NEXA Command</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Asisten AI canggih dengan mode planner, analisa beban tugas, dan rencana belajar personal
            tersedia untuk pengguna NEXA Command.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Link
              href="/dashboard/billing"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-amber-950 transition hover:bg-amber-400"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade ke Command
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Ambil deadline aktif sebagai konteks asisten.
  const { data: deadlines } = await supabase
    .from('academic_deadlines')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending', 'in_progress', 'overdue'])
    .order('deadline_date', { ascending: true })
    .limit(40)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-950">NEXA Assistant</h1>
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-0.5 text-[10px] font-black text-amber-950">
              Command
            </span>
          </div>
          <p className="text-sm text-slate-500">Asisten AI personal yang paham deadline-mu.</p>
        </div>
      </div>

      <NexaAssistantCommand
        deadlines={(deadlines ?? []) as AcademicDeadline[]}
        userName={profile?.full_name ?? null}
        campus={profile?.campus_name ?? null}
      />
    </div>
  )
}
