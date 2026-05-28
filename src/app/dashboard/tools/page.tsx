'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  BarChart3,
  BookMarked,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  GraduationCap,
  HeartPulse,
  LineChart,
  Lock,
  MessageSquareText,
  Network,
  PenTool,
  PiggyBank,
  Sparkles,
  Users,
} from 'lucide-react'
import Button from '@/components/ui/Button'

type Plan = 'Free' | 'Basic' | 'Pro'

const FEATURES = [
  { title: 'AI Ringkas Materi', icon: Bot, plan: 'Free' as Plan, desc: 'Ubah catatan panjang jadi poin belajar, outline, dan action item.' },
  { title: 'Flashcard Generator', icon: BookMarked, plan: 'Free' as Plan, desc: 'Buat kartu tanya jawab cepat dari topik kuliah.' },
  { title: 'Deadline Risk Score', icon: CalendarClock, plan: 'Free' as Plan, desc: 'Hitung risiko telat dari sisa hari, bobot tugas, dan progres.' },
  { title: 'IPK Planner', icon: LineChart, plan: 'Free' as Plan, desc: 'Simulasikan target nilai tiap mata kuliah.' },
  { title: 'Citation Builder', icon: PenTool, plan: 'Free' as Plan, desc: 'Format sitasi APA sederhana untuk jurnal, buku, dan web.' },
  { title: 'Group Project Board', icon: Users, plan: 'Free' as Plan, desc: 'Bagi peran, deadline, dan status kerja kelompok.' },
  { title: 'Scholarship Radar', icon: PiggyBank, plan: 'Basic' as Plan, desc: 'Checklist persiapan beasiswa dan prioritas dokumen.' },
  { title: 'Career Launchpad', icon: BriefcaseBusiness, plan: 'Basic' as Plan, desc: 'Mapping skill, portofolio, dan target magang.' },
  { title: 'Campus Event Hub', icon: Network, plan: 'Basic' as Plan, desc: 'Kurasi seminar, lomba, volunteer, dan agenda organisasi.' },
  { title: 'Thesis Compass', icon: GraduationCap, plan: 'Basic' as Plan, desc: 'Bantu pecah ide skripsi jadi rumusan masalah dan milestone.' },
  { title: 'Exam Readiness', icon: ClipboardCheck, plan: 'Basic' as Plan, desc: 'Cek kesiapan ujian dari confidence, latihan, dan waktu tersisa.' },
  { title: 'Mental Load Check', icon: HeartPulse, plan: 'Basic' as Plan, desc: 'Pantau beban akademik dan sarankan ritme istirahat.' },
  { title: 'Anti Plagiarism Prep', icon: FileSearch, plan: 'Pro' as Plan, desc: 'Checklist parafrase, kutipan, dan sumber sebelum submit.' },
  { title: 'AI Mentor Chat', icon: MessageSquareText, plan: 'Pro' as Plan, desc: 'Rancang sesi belajar personal dengan gaya tutor.' },
  { title: 'Campus Analytics', icon: BarChart3, plan: 'Pro' as Plan, desc: 'Dashboard performa belajar lintas dokumen, ujian, dan reminder.' },
]

const PLAN_CLASS: Record<Plan, string> = {
  Free: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Basic: 'border-blue-200 bg-blue-50 text-blue-700',
  Pro: 'border-violet-200 bg-violet-50 text-violet-700',
}

export default function CampusToolsPage() {
  const [topic, setTopic] = useState('Sistem basis data relasional')
  const [daysLeft, setDaysLeft] = useState(3)
  const [progress, setProgress] = useState(45)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selected = FEATURES[selectedIndex]
  const SelectedIcon = selected.icon

  const risk = useMemo(() => {
    const urgency = Math.max(0, 100 - daysLeft * 12)
    const missing = Math.max(0, 100 - progress)
    return Math.min(100, Math.round(urgency * 0.55 + missing * 0.45))
  }, [daysLeft, progress])

  const summary = useMemo(() => {
    const clean = topic.trim() || 'Topik kuliah'
    return [
      `${clean} perlu dipahami dari konsep inti, contoh kasus, dan latihan soal.`,
      `Mulai dari definisi utama, lanjutkan ke penerapan, lalu cek bagian yang paling sering keluar ujian.`,
      `Target hari ini: buat 5 flashcard, 1 rangkuman, dan 1 mini quiz.`,
    ]
  }, [topic])

  const flashcards = useMemo(() => {
    const clean = topic.trim() || 'Topik kuliah'
    return [
      { q: `Apa inti dari ${clean}?`, a: 'Jelaskan definisi, tujuan, dan contoh penerapan.' },
      { q: 'Bagian mana yang rawan muncul di ujian?', a: 'Konsep dasar, perbandingan istilah, dan studi kasus.' },
      { q: 'Apa latihan tercepat malam ini?', a: 'Buat rangkuman 7 poin lalu jawab 10 soal singkat.' },
    ]
  }, [topic])

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              Campus Tools
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              15 fitur produktivitas mahasiswa dalam satu dashboard.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Tools ini dibuat agar user langsung bisa mencoba planner, ringkasan, flashcard, scoring deadline, dan fitur kampus lain tanpa menunggu backend tambahan.
            </p>
          </div>
          <Link href="/pricing">
            <Button>
              <BadgeCheck className="h-4 w-4" />
              Lihat Paket
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Daftar fitur</h2>
          <div className="space-y-2">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon
              return (
                <button
                  key={feature.title}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full rounded-lg border p-3 text-left transition ${selectedIndex === index ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2 text-brand-700 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-slate-950">{feature.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${PLAN_CLASS[feature.plan]}`}>
                          {feature.plan}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{feature.desc}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <SelectedIcon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-950">{selected.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{selected.desc}</p>
              </div>
              {selected.plan === 'Pro' && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
                  <Lock className="h-4 w-4" />
                  Pro feature
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">AI study cockpit</h3>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Topik kuliah</label>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <div className="mt-4 space-y-3">
                {summary.map((item) => (
                  <div key={item} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">Flashcard cepat</h3>
              <div className="mt-4 space-y-3">
                {flashcards.map((card) => (
                  <div key={card.q} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-black text-slate-950">{card.q}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{card.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
              <div>
                <h3 className="text-lg font-black text-slate-950">Deadline risk score</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Sisa hari: {daysLeft}
                    <input type="range" min="0" max="14" value={daysLeft} onChange={(event) => setDaysLeft(Number(event.target.value))} className="mt-3 w-full" />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Progres: {progress}%
                    <input type="range" min="0" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))} className="mt-3 w-full" />
                  </label>
                </div>
              </div>
              <div className="rounded-lg bg-slate-950 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Risk score</p>
                <p className="mt-2 text-5xl font-black">{risk}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {risk > 70 ? 'Prioritaskan tugas ini hari ini.' : risk > 40 ? 'Masih aman, tapi perlu jadwal kerja.' : 'Ritmenya aman.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
