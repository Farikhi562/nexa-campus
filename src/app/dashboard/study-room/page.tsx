import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell, BookOpen, Users, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Study Room · NEXA Campus',
  description: 'Study Room — belajar bareng, leaderboard kelompok, dan sesi fokus bersama. Segera hadir.',
}

const features = [
  { icon: Users, title: 'Belajar bareng', desc: 'Buat atau gabung room belajar dengan teman sekelas.' },
  { icon: Zap, title: 'Leaderboard kelompok', desc: 'Poin fokus bersama — siapa tim paling produktif minggu ini?' },
  { icon: BookOpen, title: 'Deadline bersama', desc: 'Satu orang input, satu kelas dapat. Tidak perlu kirim ulang ke semua.' },
  { icon: Bell, title: 'Reminder satu klik', desc: 'Ingatkan semua anggota room sebelum deadline penting.' },
]

export default async function StudyRoomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.28),transparent_20rem)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(56,189,248,0.18),transparent_16rem)]" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
            <Users className="h-3.5 w-3.5" />
            Study Room
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Belajar bareng. Segera hadir.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Study Room memungkinkan kamu belajar, fokus, dan tracking deadline <em>bareng teman</em> — bukan sendirian. Kamu bisa jadi yang pertama.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2.5 text-sm font-black text-amber-200 animate-pulse-glow">
              🚧 Dalam pengembangan
            </span>
          </div>
        </div>
      </section>

      {/* Preview features — blurred FOMO */}
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, desc }, index) => (
          <Card key={title} className="relative overflow-hidden">
            <CardContent className={`p-5 ${index >= 2 ? 'blur-[2px] select-none' : ''}`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-base font-black text-slate-950">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
            </CardContent>
            {index >= 2 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60 backdrop-blur-[1px]">
                <span className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-500">
                  🔒 Segera hadir
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Notify CTA */}
      <Card className="border-teal-100 bg-gradient-to-br from-teal-50/60 to-white">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-black text-slate-950">Mau diingatkan saat Study Room rilis?</p>
            <p className="mt-1 text-sm text-slate-500">Kamu akan dapat akses lebih awal dan poin bonus peluncuran.</p>
          </div>
          <Link
            href="/dashboard/settings/profile"
            className="focus-ring inline-flex min-h-12 flex-shrink-0 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300"
          >
            <Bell className="h-4 w-4" />
            Pastiin email di profil
          </Link>
        </CardContent>
      </Card>

      <p className="px-1 text-center text-xs leading-5 text-slate-400">
        Study Room akan tersedia untuk semua tier. Fitur kolaborasi lanjutan untuk Pulse & Command.
      </p>
    </div>
  )
}
