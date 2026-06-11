import Link from 'next/link'
import { Crown, LockKeyhole, Target, TimerReset, Zap } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatDeadlineDate, formatDeadlineTime, getDisplayTitle, getUrgency, sortNearest } from '@/lib/deadline-utils'
import type { AcademicDeadline, Plan } from '@/types'

type CommandFocusPlanProps = {
  deadlines?: AcademicDeadline[]
  userTier: Plan
}

function scoreDeadline(deadline: AcademicDeadline) {
  const urgency = getUrgency(deadline)
  const priorityScore = {
    urgent: 40,
    high: 28,
    normal: 14,
    low: 6,
  }[deadline.priority]

  const urgencyScore =
    urgency.label === 'Terlambat'
      ? 60
      : urgency.days <= 0
        ? 50
        : urgency.days <= 1
          ? 42
          : urgency.days <= 3
            ? 30
            : urgency.days <= 7
              ? 18
              : 5

  const reminderPenalty = deadline.reminder_enabled ? 0 : 8
  return priorityScore + urgencyScore + reminderPenalty
}

export default function CommandFocusPlan({ deadlines, userTier }: CommandFocusPlanProps) {
  const safeTier = userTier === 'command' || userTier === 'pulse' || userTier === 'radar' ? userTier : 'radar'
  const isCommand = safeTier === 'command'
  const activeDeadlines = (deadlines ?? [])
    .filter((deadline) => deadline.status !== 'completed')
    .sort((a, b) => scoreDeadline(b) - scoreDeadline(a) || sortNearest(a, b))
    .slice(0, 3)

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.25),transparent_18rem)]" />
      <div className={isCommand ? 'relative' : 'relative select-none blur-[2px]'}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone="brand" className="mb-3 bg-teal-300/10 text-teal-100 ring-teal-300/20">
              NEXA Command
            </Badge>
            <h2 className="text-xl font-black tracking-tight">Command Focus Plan</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Urutan prioritas berdasarkan deadline terdekat, tingkat urgensi, prioritas, dan status reminder.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200">
            <Crown className="h-6 w-6" />
          </div>
        </div>

        {activeDeadlines.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-slate-300">
            Belum ada deadline aktif. Command Focus Plan akan muncul setelah kamu menambahkan deadline.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {activeDeadlines.map((deadline, index) => {
              const urgency = getUrgency(deadline)
              return (
                <article key={deadline.id} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-300/10 text-sm font-black text-teal-100">
                      {index + 1}
                    </div>
                    <Badge tone={urgency.tone}>{urgency.label}</Badge>
                  </div>
                  <h3 className="mt-4 text-sm font-black text-white">{getDisplayTitle(deadline)}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {formatDeadlineDate(deadline)} · {formatDeadlineTime(deadline)} · {deadline.priority}
                  </p>
                  <div className="mt-4 flex gap-2 text-xs leading-5 text-slate-300">
                    {index === 0 ? <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-200" /> : <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-200" />}
                    <p>
                      {index === 0
                        ? 'Kerjakan ini dulu. Deadline ini paling perlu perhatian sekarang.'
                        : deadline.reminder_enabled
                          ? 'Sudah ada reminder, tapi tetap masuk daftar fokus.'
                          : 'Belum ada reminder. Aktifkan kalau deadline ini penting.'}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/deadlines/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-teal-300"
          >
            <TimerReset className="h-4 w-4" />
            Tambah deadline prioritas
          </Link>
          <Link
            href="/dashboard/settings/reminders"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
          >
            Atur Reminder
          </Link>
        </div>
      </div>

      {!isCommand && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-white">Command Focus Plan belum aktif.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Upgrade ke NEXA Command untuk melihat prioritas otomatis dan rencana fokus harian.
            </p>
            <Link href="/pricing" className="mt-5 inline-flex rounded-2xl bg-teal-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-teal-300">
              Lihat Command
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
