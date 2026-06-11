import Link from 'next/link'
import { BellRing, CheckCircle2, Circle, Send, Share2, UserRound } from 'lucide-react'
import type { Plan } from '@/types'

type SetupChecklistProps = {
  profileCompleted: boolean
  hasDeadline: boolean
  hasTelegramChatId: boolean
  referralCode?: string | null
  userTier: Plan
}

const itemsMeta = [
  {
    key: 'profile',
    title: 'Lengkapi profil',
    desc: 'Nama, kampus, provinsi, jurusan, dan foto profil.',
    href: '/dashboard/settings/profile',
    icon: UserRound,
  },
  {
    key: 'deadline',
    title: 'Tambah deadline pertama',
    desc: 'Mulai dari tugas, praktikum, kuis, ujian, atau pembayaran.',
    href: '/dashboard/deadlines/new',
    icon: CheckCircle2,
  },
  {
    key: 'telegram',
    title: 'Aktifkan Telegram',
    desc: 'Isi chat ID dan kirim pesan percobaan.',
    href: '/dashboard/settings/reminders',
    icon: BellRing,
  },
  {
    key: 'share',
    title: 'Ajak teman',
    desc: 'Bagikan link referral ke teman yang juga butuh pengingat deadline.',
    href: '#ajak-teman',
    icon: Share2,
  },
] as const

export default function SetupChecklist({
  profileCompleted,
  hasDeadline,
  hasTelegramChatId,
  referralCode,
  userTier,
}: SetupChecklistProps) {
  const completedMap = {
    profile: profileCompleted,
    deadline: hasDeadline,
    telegram: hasTelegramChatId,
    share: Boolean(referralCode),
  }

  const completedCount = Object.values(completedMap).filter(Boolean).length
  const total = itemsMeta.length

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Setup awal</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">Siapkan NEXA supaya enak dipakai harian.</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {completedCount}/{total} selesai. Lengkapi sedikit lagi supaya dashboard makin berguna.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
          {userTier}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {itemsMeta.map(({ key, title, desc, href, icon: Icon }) => {
          const done = completedMap[key]
          const content = (
            <div className={`h-full rounded-2xl border p-4 transition ${
              done
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200 bg-slate-50 hover:border-brand-200 hover:bg-brand-50'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <Icon className={`h-5 w-5 ${done ? 'text-emerald-700' : 'text-brand-700'}`} />
                {done ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <Circle className="h-5 w-5 text-slate-300" />}
              </div>
              <p className="mt-4 text-sm font-black text-slate-950">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{desc}</p>
            </div>
          )

          if (href.startsWith('#')) {
            return (
              <a key={key} href={href} className="focus-ring rounded-2xl">
                {content}
              </a>
            )
          }

          return (
            <Link key={key} href={href} className="focus-ring rounded-2xl">
              {content}
            </Link>
          )
        })}
      </div>

      {!hasTelegramChatId && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <Send className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>
            Telegram belum aktif. Jika bot sudah dikonfigurasi, isi chat ID lalu kirim pesan percobaan di pengaturan reminder.
          </p>
        </div>
      )}
    </section>
  )
}
