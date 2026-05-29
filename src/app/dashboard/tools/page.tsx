'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Calculator,
  CalendarDays,
  ChevronRight,
  FileSearch,
  FileText,
  GraduationCap,
  Languages,
  Loader2,
  LockKeyhole,
  Map,
  Quote,
  Repeat2,
  Send,
  Sparkles,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ProUpgradeModal from '@/components/ProUpgradeModal'
import type { Profile } from '@/types'
import { canUseBasicTool } from '@/lib/plans'

type ToolId =
  | 'ipk-calculator'
  | 'citation-generator'
  | 'scholarship-checker'
  | 'career-assistant'
  | 'academic-habit-tracker'
  | 'pomodoro-timer'
  | 'grade-converter'
  | 'semester-planner'
  | 'abstract-generator'
  | 'ai-paraphraser'
  | 'simple-plagiarism-checker'
  | 'academic-translator'
  | 'mind-map-generator'
  | 'pdf-flashcard-generator'
  | 'campus-event-aggregator'

type Tool = {
  id: ToolId
  name: string
  desc: string
  icon: typeof BookOpen
  category: string
  color: string
  bgColor: string
  placeholder: string
}

const TOOLS: Tool[] = [
  {
    id: 'ipk-calculator',
    name: 'Kalkulator IPK',
    desc: 'Hitung IP semester, IPK kumulatif, dan target nilai berikutnya.',
    icon: Calculator,
    category: 'Akademik',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-100',
    placeholder: 'Contoh: Kalkulus 3 SKS nilai B, Fisika 2 SKS nilai A, Algoritma 4 SKS nilai BC...',
  },
  {
    id: 'citation-generator',
    name: 'Generator Sitasi',
    desc: 'Buat sitasi APA, MLA, Chicago, Harvard, atau IEEE.',
    icon: Quote,
    category: 'Menulis',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 border-violet-100',
    placeholder: 'Contoh: Artikel jurnal oleh Budi Santoso, 2024, judul..., format APA 7.',
  },
  {
    id: 'scholarship-checker',
    name: 'Cek Beasiswa',
    desc: 'Checklist peluang, dokumen, timeline, dan strategi apply.',
    icon: GraduationCap,
    category: 'Karier',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-100',
    placeholder: 'Contoh: Saya semester 4 Teknik Informatika IPK 3.65, ingin cari beasiswa aktif...',
  },
  {
    id: 'career-assistant',
    name: 'Career Assistant',
    desc: 'Review CV, roadmap skill, dan saran karier sesuai jurusan.',
    icon: Briefcase,
    category: 'Karier',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-100',
    placeholder: 'Contoh: Saya mahasiswa Manajemen semester 6, mau magang product marketing. Review rencana saya...',
  },
  {
    id: 'academic-habit-tracker',
    name: 'Habit Tracker Akademik',
    desc: 'Bangun rutinitas belajar, refleksi mingguan, dan anti prokrastinasi.',
    icon: TrendingUp,
    category: 'Produktivitas',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-100',
    placeholder: 'Contoh: Saya sering belajar mepet deadline dan susah konsisten. Buat tracker 14 hari.',
  },
  {
    id: 'pomodoro-timer',
    name: 'Pomodoro Timer',
    desc: 'Rancang sesi fokus dan istirahat berdasarkan beban belajar.',
    icon: Timer,
    category: 'Produktivitas',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-100',
    placeholder: 'Contoh: Saya punya 3 jam untuk belajar Statistika sebelum kuis besok.',
  },
  {
    id: 'grade-converter',
    name: 'Konverter Nilai',
    desc: 'Konversi angka ke huruf, huruf ke angka, dan simulasi bobot.',
    icon: Repeat2,
    category: 'Akademik',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-100',
    placeholder: 'Contoh: Sistem kampus saya A=85, AB=80, B=75. Nilai tugas 80, UTS 70, UAS target berapa?',
  },
  {
    id: 'semester-planner',
    name: 'Planner Semester',
    desc: 'Susun roadmap tugas, UTS/UAS, SKS, dan checkpoint belajar.',
    icon: CalendarDays,
    category: 'Produktivitas',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 border-teal-100',
    placeholder: 'Contoh: Semester ini saya ambil 7 matkul, UTS mulai 20 Oktober, bantu buat plan.',
  },
  {
    id: 'abstract-generator',
    name: 'Generator Abstrak',
    desc: 'Buat abstrak Indonesia/English dari ringkasan penelitian.',
    icon: FileText,
    category: 'Menulis',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
    placeholder: 'Tempel latar belakang, metode, hasil, dan kesimpulan penelitianmu.',
  },
  {
    id: 'ai-paraphraser',
    name: 'Parafrase AI',
    desc: 'Parafrase akademik tanpa mengubah makna dan tetap etis.',
    icon: Sparkles,
    category: 'Menulis',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50 border-fuchsia-100',
    placeholder: 'Tempel paragraf yang ingin diparafrase dengan gaya akademik formal.',
  },
  {
    id: 'simple-plagiarism-checker',
    name: 'Cek Plagiarisme Sederhana',
    desc: 'Deteksi risiko kemiripan gaya, kurang sitasi, dan klaim terlalu dekat.',
    icon: FileSearch,
    category: 'Menulis',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-100',
    placeholder: 'Tempel teks tugas dan sumber rujukan yang kamu pakai.',
  },
  {
    id: 'academic-translator',
    name: 'Translator Akademik',
    desc: 'Terjemahkan EN ke ID atau ID ke EN dengan gaya formal.',
    icon: Languages,
    category: 'Menulis',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-100',
    placeholder: 'Tempel teks dan tulis arah terjemahan: EN ke ID atau ID ke EN.',
  },
  {
    id: 'mind-map-generator',
    name: 'Mind Map Generator',
    desc: 'Ubah materi panjang menjadi struktur mind map visual berbasis teks.',
    icon: Map,
    category: 'Belajar',
    color: 'text-lime-700',
    bgColor: 'bg-lime-50 border-lime-100',
    placeholder: 'Tempel materi atau topik, misalnya teori organisasi, lalu minta mind map.',
  },
  {
    id: 'pdf-flashcard-generator',
    name: 'Flashcard Generator dari PDF',
    desc: 'Buat pasangan kartu tanya-jawab dari isi dokumen atau catatan.',
    icon: BrainCircuit,
    category: 'Belajar',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-100',
    placeholder: 'Tempel poin materi dari PDF atau dokumen detail, lalu minta 20 flashcard.',
  },
  {
    id: 'campus-event-aggregator',
    name: 'Event Kampus Aggregator',
    desc: 'Kurasi seminar, lomba, webinar, dan event kampus dari inputmu.',
    icon: BookOpen,
    category: 'Karier',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 border-sky-100',
    placeholder: 'Contoh: Saya di Bandung, minat UI/UX dan data, cari event bulan depan.',
  },
]

const CATEGORIES = ['Semua', 'Akademik', 'Belajar', 'Menulis', 'Produktivitas', 'Karier']

type Message = {
  role: 'user' | 'assistant'
  content: string
}

function ToolChat({ tool, onBack }: { tool: Tool; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, messages: nextMessages }),
      })
      const data = await response.json()
      setMessages([...nextMessages, { role: 'assistant', content: data.reply || data.error || 'Maaf, tool belum bisa menjawab.' }])
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: 'Koneksi AI sedang bermasalah. Coba lagi sebentar lagi.' }])
    } finally {
      setLoading(false)
    }
  }

  const Icon = tool.icon

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-h-[720px] max-w-3xl flex-col">
      <div className="flex items-center gap-3 rounded-t-xl border border-b-0 border-slate-200 bg-white p-4">
        <button onClick={onBack} className="rounded-lg p-1.5 transition hover:bg-slate-100" aria-label="Kembali">
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </button>
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${tool.bgColor}`}>
          <Icon className={`h-4 w-4 ${tool.color}`} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{tool.name}</p>
          <p className="truncate text-xs text-slate-500">{tool.desc}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto border-x border-slate-200 bg-slate-50 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${tool.bgColor}`}>
              <Icon className={`h-7 w-7 ${tool.color}`} />
            </div>
            <p className="font-black text-slate-950">{tool.name}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{tool.desc}</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
              message.role === 'user'
                ? 'rounded-br-sm bg-brand-600 text-white'
                : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800 shadow-sm'
            }`}>
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage()
              }
            }}
            placeholder={tool.placeholder}
            rows={2}
            className="max-h-[130px] min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Kirim"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ToolsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [activeTool, setActiveTool] = useState<Tool | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [lockedFeature, setLockedFeature] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: profileData }) => {
        if (profileData) setProfile(profileData as Profile)
      })
    })
  }, [supabase])

  const filtered = TOOLS.filter((tool) => selectedCategory === 'Semua' || tool.category === selectedCategory)

  if (activeTool) return <ToolChat tool={activeTool} onBack={() => setActiveTool(null)} />

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-100">Campus Tools</p>
            <h1 className="mb-2 text-2xl font-black sm:text-3xl">15 Tool AI untuk Mahasiswa</h1>
            <p className="max-w-2xl text-sm leading-6 text-brand-100">
              Basic membuka 5 tool pertama. Pro membuka semua tool premium tanpa antre dan tanpa halaman numpuk.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === category
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((tool) => {
          const toolIndex = TOOLS.findIndex((item) => item.id === tool.id)
          const unlocked = canUseBasicTool(toolIndex, profile)
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              type="button"
              title={unlocked ? tool.name : 'Upgrade ke Pro untuk menggunakan tool ini'}
              onClick={() => unlocked ? setActiveTool(tool) : setLockedFeature(tool.name)}
              className={`relative min-h-[176px] overflow-hidden rounded-xl border bg-white p-5 text-left transition ${
                unlocked
                  ? 'border-slate-200 hover:border-brand-300 hover:shadow-md'
                  : 'border-red-200 hover:border-red-300'
              }`}
            >
              {!unlocked && <div className="absolute inset-0 z-10 bg-white/45 backdrop-blur-[2px]" />}
              <div className={unlocked ? '' : 'blur-[1px]'}>
                <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-slate-400">{tool.category}</span>
                <div className="mb-2 flex items-start gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${tool.bgColor}`}>
                    <Icon className={`h-5 w-5 ${tool.color}`} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-black leading-snug text-slate-950">{tool.name}</p>
                  </div>
                </div>
                <p className="text-xs leading-5 text-slate-500">{tool.desc}</p>
              </div>

              {unlocked ? (
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-600">
                  <span>Jalankan tool</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              ) : (
                <div className="absolute inset-x-4 bottom-4 z-20 rounded-lg border border-red-200 bg-red-50 px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-black text-red-700">
                    <LockKeyhole className="h-4 w-4" />
                    <span>Upgrade ke Pro untuk memakai tool ini</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-red-700">Teman Pro bisa akses semua 15 tool saat tugas mulai numpuk.</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        Jawaban AI bersifat bantuan belajar. Hindari joki tugas, plagiarisme, dan penyalahgunaan akademik.
      </p>

      <ProUpgradeModal
        open={Boolean(lockedFeature)}
        feature={lockedFeature || 'Campus Tools Pro'}
        onClose={() => setLockedFeature(null)}
      />
    </div>
  )
}
