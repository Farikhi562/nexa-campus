'use client'

import { useState, useRef, useEffect } from 'react'
import {
  BookOpen,
  Calculator,
  FileText,
  GraduationCap,
  Lightbulb,
  Mic,
  Search,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Users,
  X,
  ChevronRight,
  ArrowLeft,
  Send,
  Loader2,
  Lock,
} from 'lucide-react'

// ─── Tool definitions ────────────────────────────────────────────
type ToolId =
  | 'ipk-calculator'
  | 'citation-generator'
  | 'essay-planner'
  | 'pomodoro'
  | 'summarizer'
  | 'quiz-generator'
  | 'career-advisor'
  | 'grammar-checker'
  | 'study-plan'
  | 'presentation-coach'
  | 'habit-tracker'
  | 'research-helper'
  | 'deadline-risk'
  | 'scholarship-radar'
  | 'marketplace-copy'

interface Tool {
  id: ToolId
  name: string
  desc: string
  icon: typeof BookOpen
  category: string
  color: string
  bgColor: string
  available: boolean
  systemPrompt: string
  placeholder: string
}

const TOOLS: Tool[] = [
  {
    id: 'ipk-calculator',
    name: 'Kalkulator IPK',
    desc: 'Hitung IPK semester & kumulatif dari nilai matakuliahmu.',
    icon: Calculator,
    category: 'Akademik',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-100',
    available: true,
    systemPrompt: `Kamu adalah asisten kalkulator IPK mahasiswa Indonesia. 
Bantu user menghitung IPK semester dan kumulatif berdasarkan nilai (A=4, AB=3.5, B=3, BC=2.5, C=2, D=1, E=0) dan SKS tiap matakuliah.
Jika user memberi daftar nilai, hitung IPK-nya langsung. Berikan juga analisis singkat dan tips untuk meningkatkan IPK jika diperlukan.
Balas dalam Bahasa Indonesia, ramah, dan to-the-point.`,
    placeholder: 'Contoh: Kalkulus 3 SKS nilai B, Fisika 2 SKS nilai A, Algoritma 4 SKS nilai BC...',
  },
  {
    id: 'citation-generator',
    name: 'Generator Sitasi',
    desc: 'Buat sitasi APA, MLA, Harvard, atau Chicago dari sumber apapun.',
    icon: FileText,
    category: 'Akademik',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 border-violet-100',
    available: true,
    systemPrompt: `Kamu adalah ahli sitasi akademik. Bantu mahasiswa Indonesia membuat sitasi yang benar untuk format APA 7th, MLA 9th, Harvard, atau Chicago.
Jika user memberi info sumber (judul, penulis, tahun, dll), buatkan sitasi lengkap sesuai format yang diminta.
Jika format tidak disebutkan, tanya dulu. Jelaskan komponen sitasi jika perlu.
Balas dalam Bahasa Indonesia.`,
    placeholder: 'Contoh: Buku "Metodologi Penelitian" oleh Sugiyono, 2019, Alfabeta Bandung. Format APA.',
  },
  {
    id: 'essay-planner',
    name: 'Essay & Makalah Planner',
    desc: 'Buat kerangka essay, makalah, atau skripsi yang terstruktur.',
    icon: BookOpen,
    category: 'Menulis',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-100',
    available: true,
    systemPrompt: `Kamu adalah konsultan penulisan akademik untuk mahasiswa Indonesia.
Bantu buat outline/kerangka essay, makalah, laporan, atau skripsi yang terstruktur dan logis.
Sesuaikan dengan standar akademik Indonesia: pendahuluan, tinjauan pustaka, metodologi, hasil, kesimpulan.
Berikan sub-topik yang spesifik, bukan sekadar placeholder. Bisa juga bantu dengan judul, rumusan masalah, atau tujuan penelitian.
Balas dalam Bahasa Indonesia.`,
    placeholder: 'Contoh: Saya mau buat makalah tentang dampak media sosial pada kesehatan mental remaja, 3000 kata...',
  },
  {
    id: 'pomodoro',
    name: 'Study Timer (Pomodoro)',
    desc: 'Timer Pomodoro cerdas dengan saran sesi belajar optimal.',
    icon: Timer,
    category: 'Produktivitas',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-100',
    available: true,
    systemPrompt: `Kamu adalah coach produktivitas belajar untuk mahasiswa Indonesia.
Bantu user merancang sesi belajar menggunakan teknik Pomodoro (25 menit fokus, 5 menit istirahat).
Rekomendasikan jadwal berdasarkan materi yang ingin dipelajari, tenggat waktu, dan durasi belajar yang diinginkan.
Berikan tips menghindari distraksi dan menjaga energi selama sesi belajar.
Balas dalam Bahasa Indonesia, singkat dan actionable.`,
    placeholder: 'Contoh: Saya perlu belajar Kalkulus 2 selama 3 jam untuk UAS besok, bisa buat jadwal Pomodoro?',
  },
  {
    id: 'summarizer',
    name: 'Ringkasan Teks',
    desc: 'Ringkas artikel, jurnal, atau teks panjang jadi poin-poin kunci.',
    icon: Lightbulb,
    category: 'Belajar',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-100',
    available: true,
    systemPrompt: `Kamu adalah asisten ringkasan teks akademik untuk mahasiswa Indonesia.
Ringkas teks yang diberikan menjadi:
1. Poin-poin kunci (maks 5-7 poin)
2. Kesimpulan utama (2-3 kalimat)
3. Istilah/konsep penting (jika ada)
Pertahankan akurasi dan jangan hilangkan informasi kritis. Balas dalam Bahasa Indonesia.`,
    placeholder: 'Paste teks artikel, jurnal, atau bab buku yang ingin kamu ringkas di sini...',
  },
  {
    id: 'quiz-generator',
    name: 'Generator Soal Latihan',
    desc: 'Buat soal latihan dari topik atau teks materi yang kamu input.',
    icon: Target,
    category: 'Belajar',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-100',
    available: true,
    systemPrompt: `Kamu adalah pembuat soal latihan untuk mahasiswa Indonesia.
Dari topik atau teks yang diberikan, buat 5-10 soal latihan pilihan ganda (dengan 4 pilihan A-D dan jawaban) atau soal esai singkat.
Soal harus bervariasi: pemahaman konsep, aplikasi, dan analisis. Sertakan kunci jawaban dan penjelasan singkat.
Balas dalam Bahasa Indonesia.`,
    placeholder: 'Contoh: Buat 7 soal pilihan ganda tentang Hukum Newton, tingkat SMA/D1...',
  },
  {
    id: 'career-advisor',
    name: 'Konselor Karier',
    desc: 'Saran jalur karier, internship, dan pengembangan diri sesuai jurusanmu.',
    icon: TrendingUp,
    category: 'Karier',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-100',
    available: true,
    systemPrompt: `Kamu adalah konselor karier untuk mahasiswa Indonesia.
Berikan saran jalur karier, rekomendasi magang/internship, skill yang perlu dikembangkan, dan sertifikasi yang relevan berdasarkan jurusan dan minat user.
Sesuaikan dengan kondisi pasar kerja Indonesia dan peluang global. Bisa juga bantu review CV, surat lamaran, atau persiapan wawancara.
Balas dalam Bahasa Indonesia.`,
    placeholder: 'Contoh: Saya mahasiswa Teknik Informatika semester 5, tertarik di bidang AI/ML, mau mulai dari mana?',
  },
  {
    id: 'grammar-checker',
    name: 'Grammar & Parafrase',
    desc: 'Cek dan perbaiki tata bahasa, atau parafrase kalimat akademik.',
    icon: Search,
    category: 'Menulis',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-100',
    available: true,
    systemPrompt: `Kamu adalah editor bahasa akademik untuk mahasiswa Indonesia.
Bantu user dengan:
- Cek dan koreksi tata bahasa Indonesia atau Inggris
- Parafrase kalimat agar lebih akademik dan formal
- Saran perbaikan gaya penulisan ilmiah
Berikan teks yang sudah diperbaiki beserta penjelasan singkat perubahannya.
Balas dalam Bahasa Indonesia.`,
    placeholder: 'Paste kalimat atau paragraf yang ingin dicek grammar-nya atau diparafrase...',
  },
  {
    id: 'study-plan',
    name: 'Rencana Belajar',
    desc: 'Buat jadwal belajar personal berdasarkan target dan deadline-mu.',
    icon: GraduationCap,
    category: 'Produktivitas',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-100',
    available: true,
    systemPrompt: `Kamu adalah perencana studi personal untuk mahasiswa Indonesia.
Buat jadwal belajar yang realistis dan terstruktur berdasarkan:
- Matakuliah yang perlu dipelajari
- Deadline ujian/tugas
- Jam belajar tersedia per hari
- Tingkat kesulitan tiap subjek
Hasilkan jadwal harian/mingguan yang spesifik dan achievable. Balas dalam Bahasa Indonesia.`,
    placeholder: 'Contoh: UAS 5 matakuliah dalam 2 minggu lagi, saya bisa belajar 4 jam per hari. Bantu buat jadwal!',
  },
  {
    id: 'presentation-coach',
    name: 'Coach Presentasi',
    desc: 'Tips struktur slide, teknik public speaking, dan persiapan sidang.',
    icon: Mic,
    category: 'Karier',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-100',
    available: true,
    systemPrompt: `Kamu adalah coach presentasi untuk mahasiswa Indonesia.
Bantu user mempersiapkan presentasi akademik: seminar, sidang skripsi, presentasi kelompok, atau pitching.
Berikan saran:
- Struktur slide yang efektif
- Teknik public speaking dan mengatasi gugup
- Cara menjawab pertanyaan penguji
- Latihan dan persiapan mental
Balas dalam Bahasa Indonesia.`,
    placeholder: 'Contoh: Saya mau sidang skripsi minggu depan tentang analisis data keuangan, ada tips?',
  },
  {
    id: 'habit-tracker',
    name: 'Habit & Refleksi',
    desc: 'Analisis kebiasaan belajar dan saran untuk meningkatkan konsistensi.',
    icon: Users,
    category: 'Produktivitas',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-100',
    available: true,
    systemPrompt: `Kamu adalah coach kebiasaan belajar untuk mahasiswa Indonesia.
Bantu user menganalisis dan membangun kebiasaan belajar yang konsisten. Berikan:
- Analisis kebiasaan belajar saat ini
- Strategi membangun habit positif (habit stacking, tracking, dll)
- Tips menjaga motivasi dan mengatasi prokrastinasi
- Framework refleksi mingguan
Balas dalam Bahasa Indonesia, suportif dan praktis.`,
    placeholder: 'Ceritakan kebiasaan belajarmu sekarang, atau tantangan yang kamu hadapi...',
  },
  {
    id: 'research-helper',
    name: 'Research Helper',
    desc: 'Bantu rumuskan masalah penelitian, hipotesis, dan metodologi.',
    icon: BookOpen,
    category: 'Akademik',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 border-slate-200',
    available: true,
    systemPrompt: `Kamu adalah asisten penelitian untuk mahasiswa Indonesia.
Bantu proses penelitian: merumuskan masalah, membuat hipotesis, memilih metodologi, dan merancang instrumen.
Bisa juga bantu interpretasi hasil, menulis abstrak, atau menjelaskan konsep statistik/analisis data.
Berikan penjelasan yang mudah dipahami mahasiswa. Balas dalam Bahasa Indonesia.`,
    placeholder: 'Contoh: Saya mau meneliti pengaruh penggunaan TikTok terhadap IPK mahasiswa, bantu rumuskan...',
  },
  {
    id: 'deadline-risk',
    name: 'Deadline Risk Planner',
    desc: 'Analisis risiko telat dan buat rencana penyelesaian tugas.',
    icon: Target,
    category: 'Produktivitas',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-100',
    available: true,
    systemPrompt: '',
    placeholder: 'Contoh: Deadline laporan praktikum 3 hari lagi, progres 30%, masih harus analisis data dan bikin pembahasan...',
  },
  {
    id: 'scholarship-radar',
    name: 'Scholarship Radar',
    desc: 'Checklist beasiswa, timeline dokumen, dan strategi essay.',
    icon: GraduationCap,
    category: 'Karier',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-100',
    available: true,
    systemPrompt: '',
    placeholder: 'Contoh: Saya semester 4 Teknik Informatika IPK 3.65, ingin apply beasiswa dan belum punya essay...',
  },
  {
    id: 'marketplace-copy',
    name: 'Copywriter Marketplace',
    desc: 'Buat judul dan deskripsi jualan barang/jasa kampus.',
    icon: FileText,
    category: 'Karier',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50 border-fuchsia-100',
    available: true,
    systemPrompt: '',
    placeholder: 'Contoh: Saya mau jual jasa desain PPT presentasi kuliah, target mahasiswa, harga mulai 25 ribu...',
  },
]

const CATEGORIES = ['Semua', 'Akademik', 'Belajar', 'Menulis', 'Produktivitas', 'Karier']

// ─── Chat interface ────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant'
  content: string
}

function ToolChat({ tool, onBack }: { tool: Tool; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          messages: newMessages,
        }),
      })

      const data = await response.json()
      const reply = data.reply || data.error || 'Maaf, terjadi kesalahan. Coba lagi.'

      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Koneksi bermasalah atau server AI belum siap. Pastikan OPENAI_API_KEY sudah terpasang di environment deploy.' },
      ])
    }

    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const Icon = tool.icon

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px]">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-white rounded-t-xl">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className={`w-8 h-8 rounded-lg ${tool.bgColor} border flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${tool.color}`} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm">{tool.name}</p>
          <p className="text-xs text-slate-500 truncate">{tool.desc}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className={`w-14 h-14 rounded-2xl ${tool.bgColor} border flex items-center justify-center`}>
              <Icon className={`w-7 h-7 ${tool.color}`} />
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">{tool.name}</p>
              <p className="text-sm text-slate-500 max-w-xs">{tool.desc}</p>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Ketik pertanyaanmu di bawah untuk mulai
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tool.placeholder}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 min-h-[44px] max-h-[120px]"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Enter kirim · Shift+Enter baris baru</p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────
export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Akademik')
  const [activeTool, setActiveTool] = useState<Tool | null>(null)

  const filtered = TOOLS.filter(
    (t) => selectedCategory === 'Semua' || t.category === selectedCategory
  )

  if (activeTool) {
    return (
      <div className="max-w-2xl mx-auto">
        <ToolChat tool={activeTool} onBack={() => setActiveTool(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-100 mb-1">Campus Tools</p>
            <h1 className="text-2xl font-black mb-2 sm:text-3xl">15 Tool AI untuk Mahasiswa</h1>
            <p className="text-brand-100 text-sm leading-6 max-w-xl">
              Semua tool aktif lewat OpenAI server-side. Pilih kategori, buka satu tool, lalu pakai seperti chat assistant khusus kebutuhan kampus.
            </p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-200 hover:text-brand-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              onClick={() => tool.available && setActiveTool(tool)}
              className={`relative text-left rounded-xl border bg-white p-5 transition group ${
                tool.available
                  ? 'hover:border-brand-300 hover:shadow-md cursor-pointer border-slate-200'
                  : 'border-slate-200 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Category label */}
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">
                {tool.category}
              </span>

              {/* Icon + title */}
              <div className="flex items-start gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl border ${tool.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-bold text-slate-900 text-sm leading-snug">{tool.name}</p>
                </div>
                {!tool.available && (
                  <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                )}
              </div>

              <p className="text-xs text-slate-500 leading-5">{tool.desc}</p>

              {tool.available && (
                <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
                  <span>Mulai</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-400">
        Semua tool menggunakan OpenAI via server NEXA. Jawaban bersifat informatif, bukan pengganti profesional.
      </p>
    </div>
  )
}
