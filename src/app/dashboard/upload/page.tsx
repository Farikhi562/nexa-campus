'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Upload, FileText, X, CheckCircle2, Cpu, Sparkles, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import { validateSensitiveData } from '@/lib/policy'
import AppErrorState from '@/components/AppErrorState'
import { logClientError } from '@/lib/client-error-log'

type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export default function UploadPage() {
  const router    = useRouter()
  const inputRef  = useRef<HTMLInputElement>(null)

  const [file, setFile]         = useState<File | null>(null)
  const [title, setTitle]       = useState('')
  const [dragging, setDragging] = useState(false)
  const [stage, setStage]       = useState<Stage>('idle')
  const [progress, setProgress] = useState('')
  const [docId, setDocId]       = useState<string | null>(null)
  const [error, setError]       = useState('')
  const [errorKind, setErrorKind] = useState<'upload' | 'ai' | 'network' | 'generic'>('generic')
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [isPriority, setIsPriority] = useState(false)

  const pickFile = (f: File) => {
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setError('Hanya file PDF yang didukung.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File terlalu besar. Maksimal 10 MB.')
      return
    }
    setFile(f)
    setError('')
    setPolicyAccepted(false)
    // Auto-fill title from filename
    setTitle(f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }, [])

  async function handleUpload() {
    if (!file || !title.trim()) return
    if (!policyAccepted) {
      setError('Centang konfirmasi bahwa Dokumen tidak berisi data sensitif atau konten terlarang.')
      return
    }

    const policyCheck = validateSensitiveData(`${file.name} ${title}`)
    if (!policyCheck.ok) {
      setError(policyCheck.message)
      return
    }

    setStage('uploading')
    setProgress('Mengupload file...')
    setError('')

    const uploadForm = new FormData()
    uploadForm.append('title', title.trim())
    uploadForm.append('file', file)

    const uploadRes = await fetch('/api/documents/upload', {
      method: 'POST',
      body: uploadForm,
    })
    const docData = await uploadRes.json()
    setIsPriority((docData.priority ?? 0) > 0)

    if (uploadRes.status === 401) {
      router.push('/auth/login')
      return
    }

      if (!uploadRes.ok || docData.error || !docData.id) {
        setErrorKind('upload')
        setError(docData.error || 'Upload gagal.')
        await logClientError('upload', docData.error || 'Upload gagal.')
        setStage('error')
        return
      }

    setDocId(docData.id)
    setStage('processing')
    setProgress('Mengekstrak teks dengan OCR...')

    // 3. Call process API
    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docData.id }),
    })

    const result = await res.json()

      if (!res.ok || result.error) {
        setErrorKind('ai')
        setError(result.error || 'Gagal memproses Dokumen.')
        await logClientError('ai_processing', result.error || 'Gagal memproses Dokumen.')
        setStage('error')

        return
      }

    setProgress(`${result.questionCount} soal berhasil diekstrak.`)
    setStage('done')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
          ← Kembali
        </button>
        <h1 className="font-sans text-2xl font-bold text-slate-900">Upload Materi / Soal</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload PDF diktat atau kumpulan soal ujian. AI akan otomatis mengekstrak soal pilihan ganda.
        </p>
      </div>

      {stage === 'done' ? (
        /* Success state */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-sans text-xl font-bold text-slate-900 mb-2">Dokumen Siap!</h2>
          <p className="text-slate-500 text-sm mb-6">{progress}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              Lihat Dashboard
            </Button>
            {docId && (
              <Button variant="secondary" onClick={async () => {
                const res = await fetch('/api/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ documentId: docId }),
                })
                const { data } = await res.json()
                if (data?.sessionId) router.push(`/exam/${data.sessionId}`)
              }}>
                <Sparkles className="w-4 h-4" />
                Mulai Ujian Sekarang
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            className={clsx(
              'relative bg-white rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center cursor-pointer',
              dragging          ? 'border-brand-500 bg-brand-50/50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50',
              file              && 'border-green-400 bg-green-50/30',
              stage !== 'idle'  && 'pointer-events-none opacity-80'
            )}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => stage === 'idle' && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {stage === 'idle' && (
                  <button
                    className="mt-1 text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                    onClick={e => { e.stopPropagation(); setFile(null); setTitle(''); setPolicyAccepted(false) }}
                  >
                    <X className="w-3 h-3" /> Ganti file
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center transition-colors', dragging ? 'bg-brand-100' : 'bg-slate-100')}>
                  <Upload className={clsx('w-8 h-8 transition-colors', dragging ? 'text-brand-600' : 'text-slate-400')} />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Drag & drop PDF di sini</p>
                  <p className="text-sm text-slate-400 mt-1">atau klik untuk pilih file · Maks. 10 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Title input */}
          {file && stage === 'idle' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Judul Dokumen
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="contoh: Soal UTS Manajemen Keuangan 2025"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />
                  <div>
                    <p className="text-sm font-black text-red-950">Jangan unggah data sensitif</p>
                    <p className="mt-1 text-xs leading-5 text-red-800">
                      Hindari KTP, kartu keluarga, data kesehatan, data keuangan, password, rahasia kampus, atau data pribadi orang lain. Dokumen yang melanggar hak cipta atau aturan kampus juga tidak boleh diunggah.
                    </p>
                    <label className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-red-900">
                      <input
                        type="checkbox"
                        checked={policyAccepted}
                        onChange={(event) => setPolicyAccepted(event.target.checked)}
                        className="mt-1"
                      />
                      Saya memastikan Dokumen ini aman untuk diproses dan tidak berisi data sensitif atau konten terlarang.
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Processing status */}
          {(stage === 'uploading' || stage === 'processing') && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-4 h-4 text-brand-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold text-brand-900 text-sm">
                    {stage === 'uploading' ? 'Mengupload file...' : 'AI sedang memproses...'}
                  </p>
                  <p className="text-brand-600 text-xs mt-0.5">
                    {isPriority ? '⚡ Priority Pro aktif · ' : ''}{progress || 'Harap tunggu sebentar...'}
                  </p>
                </div>
              </div>
              <div className="w-full bg-brand-200 rounded-full h-1.5">
                <div
                  className="bg-brand-600 h-1.5 rounded-full transition-all duration-1000 animate-pulse"
                  style={{ width: stage === 'uploading' ? '30%' : '75%' }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <AppErrorState
              kind={errorKind}
              message={error}
              onRetry={() => {
                setError('')
                setStage('idle')
              }}
              retryLabel={errorKind === 'ai' ? 'Retry' : 'Coba Lagi'}
            />
          )}

          {/* Upload button */}
          {file && stage === 'idle' && (
            <Button
              fullWidth
              size="lg"
              onClick={handleUpload}
              disabled={!title.trim() || !policyAccepted}
              loading={false}
            >
              <Upload className="w-5 h-5" />
              Proses dengan AI
            </Button>
          )}

          {/* Retry */}
          {stage === 'error' && (
            <Button fullWidth variant="secondary" onClick={() => { setStage('idle'); setFile(null); setTitle(''); setPolicyAccepted(false) }}>
              Coba Lagi
            </Button>
          )}

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">💡 Tips Upload</p>
            <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
              <li>Dokumen dengan teks yang jelas menghasilkan ekstrasi lebih akurat.</li>
              <li>Soal pilihan ganda dengan format A/B/C/D paling mudah diproses AI.</li>
              <li>Hindari PDF hasil scan kamera yang buram atau miring.</li>
              <li>Jika hasil kurang akurat, coba Dokumen yang kualitas cetakannya lebih baik.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
