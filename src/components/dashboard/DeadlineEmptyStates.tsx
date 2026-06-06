import Link from 'next/link'
import type { ReactNode } from 'react'
import { CalendarDays, CheckCircle2, LockKeyhole, PartyPopper, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types'

type EmptyStateProps = {
  userTier: Plan
  className?: string
}

function UpgradePrompt({ userTier }: { userTier: Plan }) {
  if (userTier !== 'radar') return null

  return (
    <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-3 text-xs leading-5 text-brand-800">
      AI Quick Add tersedia di NEXA Pulse dan Command. Radar tetap bisa input manual, pelan-pelan
      juga menang.
    </div>
  )
}

function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn('rounded-3xl border border-slate-200 bg-white p-5 shadow-sm', className)}
    >
      {children}
    </section>
  )
}

function WeekButton({ label = 'Lihat Minggu Ini' }: { label?: string }) {
  return (
    <a
      href="#deadline-week"
      className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
    >
      <CalendarDays className="h-4 w-4" />
      {label}
    </a>
  )
}

export function EmptyToday({ userTier, className }: EmptyStateProps) {
  return (
    <Shell className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950">Hari ini bersih.</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Jangan santai dulu, cek minggu depan.
            </p>
            <UpgradePrompt userTier={userTier} />
          </div>
        </div>
        <WeekButton />
      </div>
    </Shell>
  )
}

export function EmptyAll({ userTier, className }: EmptyStateProps) {
  const aiLocked = userTier === 'radar'

  return (
    <Shell className={cn('text-center', className)}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Plus className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-black text-slate-950">Belum ada deadline yang dicatat.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Biasanya dari mana info tugasmu?
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard/deadlines/new"
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-black text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Deadline Pertama
        </Link>
        {aiLocked ? (
          <button
            type="button"
            disabled
            className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black text-slate-400"
          >
            <LockKeyhole className="h-4 w-4" />
            Coba AI Quick Add
          </button>
        ) : (
          <Link
            href="/dashboard/deadlines/quick-add"
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4" />
            Coba AI Quick Add
          </Link>
        )}
      </div>
      <UpgradePrompt userTier={userTier} />
    </Shell>
  )
}

export function EmptyOverdue({ userTier, className }: EmptyStateProps) {
  return (
    <Shell className={className}>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 flex gap-1">
          {[0, 1, 2, 3, 4].map((item) => (
            <span
              key={item}
              className="h-2 w-2 animate-[confetti_1.8s_ease-in-out_infinite] rounded-full bg-teal-400"
              style={{ animationDelay: `${item * 140}ms` }}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <PartyPopper className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950">Tidak ada yang telat.</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Pertahankan.</p>
            <UpgradePrompt userTier={userTier} />
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function AllDone({ userTier, className }: EmptyStateProps) {
  return (
    <Shell className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950">Semua beres hari ini.</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">NEXA bangga (sedikit).</p>
            <UpgradePrompt userTier={userTier} />
          </div>
        </div>
        <WeekButton label="Lihat deadline minggu ini" />
      </div>
    </Shell>
  )
}
