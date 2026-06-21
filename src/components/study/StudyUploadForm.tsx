'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Sparkles, Upload } from 'lucide-react'

const CLIENT_TIMEOUT_MS = 40_000
const MAX_FILE_MB = 3

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

async function postGenerate(body: Record<string, unknown>): Promise<{ ok: boolean; data: unknown }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)
  try {
    const res = await fetch('/api/study/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, data }
  } finally {
    clearTimeout(timer)
  }
}

export default function StudyUploadForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'file' | 'text'>('text')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function submitText() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const { ok, data } = await postGenerate({ text }) as { ok: boolean; data: { error?: string; data?: { id: string } } | null }
      if (!ok || !data?.data) {
        setError(data?.error || 'Gagal membuat materi belajar.')
        return
      }
      router.push(`/dashboard/study/${data.data.id}`)
    } catch (err) {
      setError(err instanceof DOMException && err.name === 'AbortError'
        ? 'Proses terlalu lama. Coba materi yang lebih pendek.'
        : 'Koneksi bermasalah. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  async function submitFile(file: File) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_FILE_MB}MB. File kamu ${(file.size / 1024 / 1024).toFixed(1)}MB.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const base64 = await fileToBase64(file)
      const { ok, data } = await postGenerate({
        file: base64,
        mimeType: file.type || 'application/octet-stream',
        filename: file.name,
      }) as { ok: boolean; data: { error?: string; data?: { id: string } } | null }
      if (!ok || !data?.data) {
        setError(data?.error || 'Gagal membaca/memproses file.')
        return
      }
      router.push(`/dashboard/study/${data.data.id}`)
    } catch (err) {
      setError(err instanceof DOMException && err.name === 'AbortError'
        ? 'Proses terlalu lama. Coba file yang lebih kecil.'
        : 'Koneksi bermasalah. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-950">Belajar dari Materi</h2>
          <p className="text-xs text-slate-500">Tempel catatan/transkrip dosen, atau upload file — NEXA susunkan roadmap, rangkuman, dan quiz.</p>
        </div>
      </div>

      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`rounded-full px-3 py-1.5 text-xs font-black transition ${mode === 'text' ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
        >
          Tempel Teks
        </button>
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`rounded-full px-3 py-1.5 text-xs font-black transition ${mode === 'file' ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
        >
          Upload File
        </button>
      </div>

      {mode === 'text' ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            maxLength={12000}
            disabled={loading}
            placeholder="Tempel catatan kuliah, transkrip ucapan dosen, atau ringkasan slide di sini..."
            className="focus-ring w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={submitText}
            disabled={loading || !text.trim()}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Menyusun materi...' : 'Susun Materi Belajar'}
          </button>
        </div>
      ) : (
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-8 text-center transition hover:border-violet-300">
          {loading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              <span className="text-sm font-bold text-slate-700">Menyusun materi belajar...</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-violet-600" />
              <span className="text-sm font-bold text-slate-700">Tap untuk pilih PDF / DOCX</span>
              <span className="text-xs text-slate-400">Maks {MAX_FILE_MB}MB</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) submitFile(file)
              e.target.value = ''
            }}
          />
        </label>
      )}

      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] leading-4 text-slate-400">
        <FileText className="h-3 w-3 flex-none" />
        Proses biasanya 10-30 detik tergantung panjang materi.
      </p>
    </div>
  )
}
