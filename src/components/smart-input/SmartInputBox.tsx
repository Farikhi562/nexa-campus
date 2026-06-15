'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Brain, FileText, Image as ImageIcon, Keyboard, Loader2, Lock, Sparkles, Upload } from 'lucide-react'
import type { SmartInputCandidate } from '@/lib/smart-input/types'
import SmartManualForm from './SmartManualForm'
import SmartInputPreview from './SmartInputPreview'

type Plan = 'radar' | 'pulse' | 'command'

type TabId = 'manual' | 'nlp' | 'image' | 'file'

const TABS: Array<{ id: TabId; label: string; icon: typeof Keyboard; ai: boolean }> = [
  { id: 'manual', label: 'Ketik Manual', icon: Keyboard, ai: false },
  { id: 'nlp', label: 'Bahasa Natural', icon: Brain, ai: true },
  { id: 'image', label: 'Upload Gambar', icon: ImageIcon, ai: true },
  { id: 'file', label: 'Upload File', icon: FileText, ai: true },
]

type PreviewState = {
  candidates: SmartInputCandidate[]
  source: 'ai' | 'fallback' | 'error'
  logId: string | null
  inputType: 'nlp' | 'image' | 'file'
}

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

export default function SmartInputBox({ plan, defaultCampus }: { plan: Plan; defaultCampus: string }) {
  const [tab, setTab] = useState<TabId>('manual')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLocked = (tabId: TabId) => plan === 'radar' && TABS.find((t) => t.id === tabId)?.ai

  async function runNlp() {
    const value = text.trim()
    if (!value) return
    setLoading(true)
    setError('')
    setPreview(null)
    try {
      const res = await fetch('/api/ai/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        setError(data?.error || 'Gagal memproses teks.')
        return
      }
      if (!data.candidates?.length) {
        setError('Belum kebaca ada tugas/jadwal dari teks ini. Coba lebih spesifik atau pakai input Manual.')
        return
      }
      setPreview({ candidates: data.candidates, source: data.source, logId: data.logId, inputType: 'nlp' })
      setText('')
    } catch {
      setError('Koneksi bermasalah. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  async function runImage(file: File) {
    setLoading(true)
    setError('')
    setPreview(null)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/ai/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        setError(data?.error || 'Gagal membaca gambar.')
        return
      }
      setPreview({ candidates: data.candidates, source: data.source, logId: data.logId, inputType: 'image' })
    } catch {
      setError('Koneksi bermasalah. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  async function runFile(file: File) {
    setLoading(true)
    setError('')
    setPreview(null)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/ai/parse-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, mimeType: file.type || 'application/octet-stream', filename: file.name }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        setError(data?.error || 'Gagal membaca file.')
        return
      }
      setPreview({ candidates: data.candidates, source: data.source, logId: data.logId, inputType: 'file' })
    } catch {
      setError('Koneksi bermasalah. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  function switchTab(id: TabId) {
    setTab(id)
    setError('')
    setPreview(null)
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-950">Tambah Tugas / Deadline</h2>
          <p className="text-xs text-slate-500">Tulis, upload gambar, atau upload file tugas kamu — NEXA yang rapikan.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          const locked = isLocked(t.id)
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`inline-flex flex-none items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
                active ? 'bg-teal-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {locked && <Lock className="h-3 w-3 opacity-70" />}
            </button>
          )
        })}
      </div>

      {/* Locked state for AI tabs on Radar */}
      {isLocked(tab) ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <Lock className="mx-auto mb-2 h-5 w-5 text-amber-600" />
          <p className="text-sm font-bold text-amber-800">Mode ini pakai AI</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-amber-700">
            Upgrade ke NEXA Pulse/Command untuk pakai Bahasa Natural, Upload Gambar, dan Upload File.
            Input Manual tetap gratis &amp; tanpa batas.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-amber-950 hover:bg-amber-400"
          >
            Lihat paket
          </Link>
        </div>
      ) : (
        <>
          {tab === 'manual' && <SmartManualForm defaultCampus={defaultCampus} />}

          {tab === 'nlp' && (
            <div className="space-y-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder='Contoh: "besok jam 9 ada quiz kalkulus" atau "deadline laporan AI hari Jumat jam 23.59"'
                className="focus-ring w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={runNlp}
                disabled={loading || !text.trim()}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                Proses dengan AI
              </button>
            </div>
          )}

          {tab === 'image' && (
            <div className="space-y-2">
              <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center transition hover:border-teal-300">
                <ImageIcon className="h-6 w-6 text-teal-600" />
                <span className="text-sm font-bold text-slate-700">
                  {loading ? 'Membaca gambar...' : 'Tap untuk pilih screenshot tugas'}
                </span>
                <span className="text-xs text-slate-400">JPG/PNG/WebP, maks 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="hidden"
                  disabled={loading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) runImage(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          )}

          {tab === 'file' && (
            <div className="space-y-2">
              <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center transition hover:border-teal-300">
                <Upload className="h-6 w-6 text-teal-600" />
                <span className="text-sm font-bold text-slate-700">
                  {loading ? 'Membaca file...' : 'Tap untuk pilih PDF / DOCX'}
                </span>
                <span className="text-xs text-slate-400">PDF atau Word (.docx), maks 8MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  disabled={loading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) runFile(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          )}

          {error && (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>
          )}
        </>
      )}

      {preview && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <SmartInputPreview
            candidates={preview.candidates}
            source={preview.source}
            logId={preview.logId}
            inputType={preview.inputType}
            onDone={() => setPreview(null)}
          />
        </div>
      )}
    </div>
  )
}
