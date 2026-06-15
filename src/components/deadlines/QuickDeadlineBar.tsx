'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sparkles, CornerDownLeft, CheckCircle2 } from 'lucide-react'

const HINTS = [
  'tugas kalkulus bab 3 jumat jam 5 sore vclass',
  'bayar ukt 20 juni',
  'kuis fisika besok jam 9 pagi',
]

export default function QuickDeadlineBar() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function submit() {
    const value = text.trim()
    if (!value || loading) return
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/deadlines/quick-nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.data) {
        setMsg({ type: 'err', text: data?.error || 'Gagal menambah. Coba sebutkan tanggalnya.' })
        return
      }
      const d = data.data
      setMsg({
        type: 'ok',
        text: `Tersimpan: "${d.course_name}" — ${d.deadline_date} ${d.deadline_time}${data.notice ? ` · ${data.notice}` : ''}`,
      })
      setText('')
      router.refresh()
    } catch {
      setMsg({ type: 'err', text: 'Koneksi bermasalah. Coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-teal-700">
        <Sparkles className="h-4 w-4" />
        Quick Add — ketik bebas, NEXA yang rapikan
      </div>
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          maxLength={500}
          placeholder='Contoh: "tugas kalkulus jumat jam 5 sore vclass"'
          className="focus-ring min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !text.trim()}
          className="inline-flex min-h-11 flex-none items-center gap-1.5 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-40"
        >
          {loading ? 'Memproses...' : 'Tambah'}
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </div>

      {!msg && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HINTS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setText(h)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:border-teal-200 hover:text-teal-700"
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {msg && (
        <div
          className={`mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-xs leading-5 ${
            msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {msg.type === 'ok' && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />}
          <span>{msg.text}</span>
        </div>
      )}
    </div>
  )
}
