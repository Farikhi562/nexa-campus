'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, Sparkles, X, Zap } from 'lucide-react'
import type { Flashcard, FlashcardBoxes, FlashcardSchedule } from '@/lib/study/types'

type Props = { packId: string }
const SAVE_DEBOUNCE_MS = 1200

function jakartaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function intervalFor(box: 1 | 2 | 3, previous = 0) {
  if (box === 1) return 1
  if (box === 2) return Math.min(14, Math.max(3, Math.round(previous * 1.7)))
  return Math.min(30, Math.max(7, Math.round(previous * 2.2)))
}

export default function FlashcardView({ packId }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [boxes, setBoxes] = useState<FlashcardBoxes>({})
  const [schedule, setSchedule] = useState<FlashcardSchedule>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [extraPractice, setExtraPractice] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const response = await fetch(`/api/study/packs/${packId}/flashcards`, { cache: 'no-store' })
    const result = await response.json().catch(() => ({}))
    if (response.ok) {
      setCards(result.flashcards ?? [])
      setBoxes(result.boxes ?? {})
      setSchedule(result.schedule ?? {})
    } else {
      setError(result.error || 'Flashcard gagal dimuat.')
    }
    setLoading(false)
  }, [packId])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/study/packs/${packId}/flashcards`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxes, schedule }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        setError(result.error || 'Progress flashcard gagal disimpan.')
      } else {
        setDirty(false)
      }
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [boxes, dirty, packId, schedule])

  async function generate() {
    setGenerating(true)
    setError('')
    const response = await fetch(`/api/study/packs/${packId}/flashcards`, { method: 'POST' })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(result.error || 'Gagal generate flashcard.')
      setGenerating(false)
      return
    }
    setCards(result.flashcards ?? [])
    setBoxes(result.boxes ?? {})
    setSchedule(result.schedule ?? {})
    setCurrentIdx(0)
    setFlipped(false)
    setGenerating(false)
  }

  const today = jakartaDate()
  const dueIndexes = useMemo(() => cards.map((_, index) => index).filter((index) => {
    const item = schedule[String(index)]
    return !item || item.nextReview <= today
  }), [cards, schedule, today])

  const allOrder = useMemo(() => cards.map((_, index) => index).sort((a, b) => {
    const boxA = boxes[String(a)] ?? 1
    const boxB = boxes[String(b)] ?? 1
    return boxA - boxB
  }), [boxes, cards])

  const sessionOrder = dueIndexes.length > 0 && !extraPractice ? dueIndexes : allOrder
  const activeCardIndex = sessionOrder[currentIdx % Math.max(sessionOrder.length, 1)] ?? 0
  const totalKnown = cards.filter((_, index) => boxes[String(index)] === 3).length
  const progress = cards.length > 0 ? totalKnown / cards.length : 0

  function rateCard(box: 1 | 2 | 3) {
    const key = String(activeCardIndex)
    const previous = schedule[key]
    const intervalDays = intervalFor(box, previous?.intervalDays ?? 0)
    setBoxes((current) => ({ ...current, [key]: box }))
    setSchedule((current) => ({
      ...current,
      [key]: {
        lastReviewed: today,
        nextReview: shiftDate(today, intervalDays),
        intervalDays,
        repetitions: (previous?.repetitions ?? 0) + 1,
      },
    }))
    setDirty(true)
    setFlipped(false)
    setCurrentIdx(0)
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-violet-400" /></div>

  if (cards.length === 0) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-slate-500">Belum ada flashcard. Generate dari materi yang ada?</p>
        <button onClick={generate} disabled={generating} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Generating...' : 'Generate Flashcard'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  if (dueIndexes.length === 0 && !extraPractice) {
    const nextDates = Object.values(schedule).map((item) => item.nextReview).sort()
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <Check className="mx-auto h-8 w-8 text-emerald-600" />
        <h3 className="mt-3 text-lg font-black text-slate-950">Review hari ini selesai.</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Kartu berikutnya dijadwalkan {nextDates[0] ?? 'besok'}. Otak dikasih jeda dulu, konsep revolusioner buat manusia yang hobi SKS.</p>
        <button onClick={() => setExtraPractice(true)} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">
          <RefreshCw className="h-3.5 w-3.5" /> Latihan ekstra
        </button>
      </div>
    )
  }

  const card = cards[activeCardIndex]
  const nextReview = schedule[String(activeCardIndex)]?.nextReview

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-500">{totalKnown}/{cards.length} dikuasai · {dueIndexes.length} perlu direview hari ini</p>
            {nextReview && <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-violet-600"><CalendarClock className="h-3 w-3" /> Jadwal kartu ini: {nextReview}</p>}
          </div>
          <button onClick={generate} disabled={generating} className="text-xs font-bold text-violet-600 hover:underline">{generating ? 'Regenerating...' : 'Regenerate'}</button>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${progress * 100}%` }} /></div>
        <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
          <span className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-600">Belum: {cards.filter((_, index) => !boxes[String(index)] || boxes[String(index)] === 1).length}</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-600">Belajar: {cards.filter((_, index) => boxes[String(index)] === 2).length}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">Kuasai: {totalKnown}</span>
        </div>
      </div>

      <div className="relative mx-auto h-56 max-w-lg cursor-pointer select-none sm:h-64" onClick={() => setFlipped((value) => !value)} style={{ perspective: '1000px' }}>
        <div className="relative h-full w-full transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm" style={{ backfaceVisibility: 'hidden' }}>
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-violet-400">Pertanyaan</p>
            <p className="text-center text-lg font-black leading-snug text-slate-950">{card.front}</p>
            <p className="mt-4 text-xs text-slate-400">Tap untuk lihat jawaban</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-emerald-500">Jawaban</p>
            <p className="text-center text-sm leading-6 text-slate-800">{card.back}</p>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => rateCard(1)} className="flex flex-col items-center gap-1 rounded-2xl border border-red-200 bg-red-50 py-3 text-xs font-black text-red-700 hover:bg-red-100"><X className="h-5 w-5" /> Besok lagi</button>
          <button onClick={() => rateCard(2)} className="flex flex-col items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 py-3 text-xs font-black text-amber-700 hover:bg-amber-100"><Zap className="h-5 w-5" /> Mulai paham</button>
          <button onClick={() => rateCard(3)} className="flex flex-col items-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-100"><Check className="h-5 w-5" /> Sudah tahu</button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { setCurrentIdx((index) => Math.max(0, index - 1)); setFlipped(false) }} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"><ChevronLeft className="h-5 w-5" /></button>
          <p className="text-xs text-slate-400">{(currentIdx % sessionOrder.length) + 1} / {sessionOrder.length}</p>
          <button onClick={() => { setCurrentIdx((index) => (index + 1) % sessionOrder.length); setFlipped(false) }} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"><ChevronRight className="h-5 w-5" /></button>
        </div>
      )}
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  )
}
