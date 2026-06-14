'use client'

import { useRef, useState } from 'react'
import { Mic, PauseCircle, Send, Trash2 } from 'lucide-react'

type VoiceNoteRecorderProps = {
  roomId: string
  disabled?: boolean
  onUploaded?: () => void
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function VoiceNoteRecorder({ roomId, disabled, onUploaded }: VoiceNoteRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function startRecording() {
    setError('')
    setAudioBlob(null)
    setAudioUrl('')
    setDuration(0)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Browser ini belum support rekam voice note. Browsernya ikut UTS susulan kayaknya.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      const start = Date.now()
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - start) / 1000))
      }, 500)
    } catch (err) {
      setError('Mic ditolak browser. Allow microphone dulu, jangan berharap VN muncul dari doa.')
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    setRecording(false)
  }

  function resetRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl('')
    setDuration(0)
    setError('')
  }

  async function uploadVoiceNote() {
    if (!audioBlob || uploading) return
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      const extension = audioBlob.type.includes('mp4') ? 'm4a' : 'webm'
      formData.append('audio', audioBlob, `voice-note-${Date.now()}.${extension}`)
      formData.append('duration', String(duration))

      const res = await fetch(`/api/study-room/${roomId}/voice-notes`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Upload voice note gagal')

      resetRecording()
      onUploaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload voice note gagal. Teknologi memang hobi ngambek.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-950 dark:text-white">Voice Note</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rekam VN buat Study Room. Maks 10MB, Command-only.</p>
        </div>
        <div className="text-sm font-black text-teal-600 dark:text-teal-300">{formatSeconds(duration)}</div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {!recording ? (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={startRecording}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mic className="h-4 w-4" /> Mulai Rekam
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-400"
          >
            <PauseCircle className="h-4 w-4" /> Stop Rekam
          </button>
        )}

        {audioUrl ? <audio controls src={audioUrl} className="min-w-0 flex-1" /> : null}

        {audioBlob ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={uploadVoiceNote}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              <Send className="h-4 w-4" /> {uploading ? 'Upload...' : 'Kirim'}
            </button>
            <button
              type="button"
              onClick={resetRecording}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Trash2 className="h-4 w-4" /> Hapus
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}
    </div>
  )
}
