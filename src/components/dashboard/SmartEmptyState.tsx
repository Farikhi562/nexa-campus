import Link from 'next/link'
import { ArrowRight, BookOpen, MessageCircle, Search, Sparkles, Sword, Target, UserPlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type EmptyKind = 'deadlines' | 'friends' | 'arena' | 'study-room' | 'chat' | 'activity' | 'generic'

const presets: Record<EmptyKind, {
  icon: typeof Sparkles
  eyebrow: string
  title: string
  copy: string
  primaryLabel?: string
  primaryHref?: string
  tips: string[]
}> = {
  deadlines: {
    icon: Target,
    eyebrow: 'Mulai dari satu hal kecil',
    title: 'Belum ada deadline aktif.',
    copy: 'Catat satu tugas dulu. Setelah itu, dashboard akan bantu kamu melihat mana yang perlu dikerjakan lebih dulu.',
    primaryLabel: 'Tambah deadline',
    primaryHref: '/dashboard/deadlines/new',
    tips: ['Tugas', 'Praktikum', 'Kuis', 'Ujian'],
  },
  friends: {
    icon: UserPlus,
    eyebrow: 'Mulai terhubung',
    title: 'Belum ada teman di NEXA.',
    copy: 'Cari teman satu kampus, satu jurusan, atau pakai Nexa ID. Setelah request diterima, kamu bisa mulai chat pribadi.',
    tips: ['Cari nama', 'Cari kampus', 'Ketik Nexa ID', 'Kirim request'],
  },
  arena: {
    icon: Sword,
    eyebrow: 'Cari tim',
    title: 'Belum ada postingan cari tim.',
    copy: 'Buat postingan untuk project, lomba, atau hackathon kecil. Jelaskan kebutuhan tim supaya orang yang cocok lebih mudah menemukanmu.',
    tips: ['Cari UI/UX', 'Cari backend', 'Cari AI', 'Cari presenter'],
  },
  'study-room': {
    icon: BookOpen,
    eyebrow: 'Belajar bareng',
    title: 'Belum ada Study Room.',
    copy: 'Buat room kecil untuk belajar bareng. Nama member tetap tampil di grup, dan status online mengikuti pengaturan privasi.',
    tips: ['Buat room publik', 'Join via kode', 'Invite teman', 'Belajar bareng'],
  },
  chat: {
    icon: MessageCircle,
    eyebrow: 'Chat pribadi',
    title: 'Belum ada chat.',
    copy: 'Chat pribadi hanya terbuka setelah request pertemanan diterima, jadi percakapan tetap lebih aman dan terkontrol.',
    tips: ['Tambah teman', 'Tunggu accepted', 'Kirim emoji', 'Kirim file'],
  },
  activity: {
    icon: Sparkles,
    eyebrow: 'Aktivitas kampus',
    title: 'Aktivitas masih kosong.',
    copy: 'Selesaikan deadline, check-in Daily Pulse, join Study Room, atau masuk Arena. Aktivitasmu akan muncul di sini setelah mulai berjalan.',
    tips: ['Check-in harian', 'Selesaikan deadline', 'Join room', 'Cari tim'],
  },
  generic: {
    icon: Search,
    eyebrow: 'Kosong dulu',
    title: 'Belum ada data.',
    copy: 'Belum ada aktivitas yang bisa ditampilkan. Mulai dari satu aksi kecil, lalu cek lagi nanti.',
    tips: ['Mulai dulu', 'Cek lagi nanti'],
  },
}

type SmartEmptyStateProps = {
  kind?: EmptyKind
  title?: string
  copy?: string
  eyebrow?: string
  className?: string
  action?: ReactNode
  compact?: boolean
}

export default function SmartEmptyState({
  kind = 'generic',
  title,
  copy,
  eyebrow,
  className,
  action,
  compact = false,
}: SmartEmptyStateProps) {
  const preset = presets[kind]
  const Icon = preset.icon

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className={cn('relative text-center', compact ? 'p-5' : 'p-8 sm:p-10')}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.12),transparent_20rem)]" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15">
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">{eyebrow ?? preset.eyebrow}</p>
          <h3 className="mt-2 text-lg font-black text-slate-950">{title ?? preset.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{copy ?? preset.copy}</p>

          {preset.tips.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {preset.tips.map((tip) => (
                <span key={tip} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                  {tip}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5">
            {action ?? (preset.primaryHref && preset.primaryLabel ? (
              <Link
                href={preset.primaryHref}
                className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {preset.primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
