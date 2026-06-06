'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  Lock,
  Presentation,
  Receipt,
  Timer,
  X,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import {
  formatDeadlineDate,
  formatDeadlineTime,
  getDeadlineDateTime,
  getDisplayTitle,
  getPriorityTone,
  getStatusTone,
  getUrgency,
  sortNearest,
} from '@/lib/deadline-utils'
import { getTypeLabel } from '@/lib/nexa-data'
import type { AcademicDeadline, DeadlineType, Plan } from '@/types'

type ShareDeadlineModalProps = {
  deadlines: AcademicDeadline[]
  userName?: string | null
  userTier: Plan
  onClose: () => void
}

type TabId = 'image' | 'pdf' | 'calendar'

const tabs: Array<{ id: TabId; label: string; icon: typeof ImageIcon }> = [
  { id: 'image', label: 'Gambar', icon: ImageIcon },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'calendar', label: 'Kalender', icon: CalendarDays },
]

const typeIcons: Record<DeadlineType, typeof BookOpen> = {
  tugas: BookOpen,
  praktikum: FlaskConical,
  kuis: Timer,
  ujian: FileText,
  presentasi: Presentation,
  administrasi: Briefcase,
  pembayaran: CreditCard,
  organisasi: CalendarDays,
  lainnya: Receipt,
}

function dateStamp(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function humanDate(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function loadHtml2Canvas() {
  type Html2Canvas = (
    element: HTMLElement,
    options?: {
      backgroundColor?: string
      scale?: number
      useCORS?: boolean
    }
  ) => Promise<HTMLCanvasElement>

  const existing = (window as Window & { html2canvas?: Html2Canvas }).html2canvas
  if (existing) return Promise.resolve(existing)

  return new Promise<Html2Canvas>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
    script.async = true
    script.onload = () => {
      const loaded = (window as Window & { html2canvas?: Html2Canvas }).html2canvas
      if (loaded) resolve(loaded)
      else reject(new Error('html2canvas gagal dimuat.'))
    }
    script.onerror = () => reject(new Error('html2canvas gagal dimuat.'))
    document.head.appendChild(script)
  })
}

function loadJsPdf() {
  type JsPdfDocument = {
    internal: { pageSize: { getWidth(): number; getHeight(): number } }
    setFont(fontName: string, fontStyle?: string): void
    setFontSize(size: number): void
    setTextColor(r: number, g?: number, b?: number): void
    setDrawColor(r: number, g?: number, b?: number): void
    setFillColor(r: number, g?: number, b?: number): void
    text(text: string | string[], x: number, y: number): void
    line(x1: number, y1: number, x2: number, y2: number): void
    rect(x: number, y: number, width: number, height: number, style?: string): void
    splitTextToSize(text: string, size: number): string[]
    addPage(): void
    save(filename: string): void
  }
  type JsPdfConstructor = new (options?: { unit?: string; format?: string }) => JsPdfDocument
  type JsPdfWindow = Window & { jspdf?: { jsPDF?: JsPdfConstructor } }

  const existing = (window as JsPdfWindow).jspdf?.jsPDF
  if (existing) return Promise.resolve(existing)

  return new Promise<JsPdfConstructor>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
    script.async = true
    script.onload = () => {
      const loaded = (window as JsPdfWindow).jspdf?.jsPDF
      if (loaded) resolve(loaded)
      else reject(new Error('jsPDF gagal dimuat.'))
    }
    script.onerror = () => reject(new Error('jsPDF gagal dimuat.'))
    document.head.appendChild(script)
  })
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function formatIcsDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    'T',
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    '00',
  ].join('')
}

function upcoming(deadlines: AcademicDeadline[]) {
  const now = new Date()
  return deadlines
    .filter(
      (deadline) =>
        deadline.status !== 'completed' && getDeadlineDateTime(deadline).getTime() >= now.getTime()
    )
    .sort(sortNearest)
}

function nextSevenDays(deadlines: AcademicDeadline[]) {
  const now = new Date()
  const limit = new Date(now)
  limit.setDate(limit.getDate() + 7)
  return upcoming(deadlines).filter((deadline) => {
    const due = getDeadlineDateTime(deadline)
    return due.getTime() <= limit.getTime()
  })
}

export default function ShareDeadlineModal({
  deadlines,
  userName,
  userTier,
  onClose,
}: ShareDeadlineModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('image')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const cardRef = useRef<HTMLDivElement | null>(null)

  const imageDeadlines = useMemo(() => nextSevenDays(deadlines), [deadlines])
  const exportDeadlines = useMemo(() => upcoming(deadlines), [deadlines])
  const canUsePremiumExport = userTier !== 'radar'
  const today = dateStamp()

  async function exportImage() {
    if (!cardRef.current || busy) return
    setBusy(true)
    setMessage('')

    try {
      const html2canvas = await loadHtml2Canvas()
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617',
        scale: Math.min(window.devicePixelRatio || 2, 3),
        useCORS: true,
      })
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          setMessage('Gagal membuat gambar. Coba lagi sebentar.')
          setBusy(false)
          return
        }
        downloadBlob(blob, `nexa-deadline-${today}.png`)
        setMessage('Gambar deadline berhasil diunduh.')
        setBusy(false)
      }, 'image/png')
    } catch {
      setMessage('Gagal membuat gambar. Browser kamu mungkin memblokir render canvas.')
      setBusy(false)
    }
  }

  async function exportPdf() {
    if (!canUsePremiumExport || busy) return
    setBusy(true)
    setMessage('')

    const JsPDF = await loadJsPdf()
    const doc = new JsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    const widths = [10, 54, 26, 34, 24, 24]
    let y = 24

    function footer() {
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('Generated by NEXA Campus · campus.nexatechlabs.my.id', margin, pageHeight - 10)
    }

    function header() {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(15, 23, 42)
      doc.text(
        `NEXA Campus — Deadline Summary ${userName || 'Mahasiswa'} — ${humanDate()}`,
        margin,
        14
      )
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, 18, pageWidth - margin, 18)
      y = 28
    }

    function tableHeader() {
      const headers = ['No', 'Deadline', 'Kategori', 'Due Date', 'Prioritas', 'Status']
      let x = margin
      doc.setFillColor(15, 23, 42)
      doc.rect(margin, y - 6, pageWidth - margin * 2, 9, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      headers.forEach((item, index) => {
        doc.text(item, x + 1.5, y)
        x += widths[index]
      })
      y += 8
    }

    header()
    tableHeader()

    exportDeadlines.forEach((deadline, index) => {
      if (y > pageHeight - 22) {
        footer()
        doc.addPage()
        header()
        tableHeader()
      }

      const row = [
        String(index + 1),
        getDisplayTitle(deadline),
        getTypeLabel(deadline.type),
        `${formatDeadlineDate(deadline)} ${formatDeadlineTime(deadline)}`,
        deadline.priority,
        deadline.status,
      ]
      const wrappedTitle = doc.splitTextToSize(row[1], widths[1] - 3)
      const rowHeight = Math.max(9, wrappedTitle.length * 4.2 + 3)
      let x = margin

      doc.setDrawColor(226, 232, 240)
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.rect(margin, y - 5, pageWidth - margin * 2, rowHeight, 'S')
      row.forEach((item, cellIndex) => {
        const text =
          cellIndex === 1 ? wrappedTitle : doc.splitTextToSize(item, widths[cellIndex] - 3)
        doc.text(text, x + 1.5, y)
        x += widths[cellIndex]
      })
      y += rowHeight
    })

    if (exportDeadlines.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.text('Belum ada deadline aktif yang akan datang.', margin, y + 4)
    }

    footer()
    doc.save(`nexa-deadline-summary-${today}.pdf`)
    setMessage('PDF summary berhasil diunduh.')
    setBusy(false)
  }

  function exportCalendar() {
    if (!canUsePremiumExport || busy) return
    setBusy(true)
    setMessage('')

    const created = new Date()
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NEXA Campus//Deadline Export//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ]

    exportDeadlines.forEach((deadline) => {
      const due = getDeadlineDateTime(deadline)
      const uid = `${deadline.id}@campus.nexatechlabs.my.id`
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatIcsDate(created)}`,
        `DTSTART:${formatIcsDate(due)}`,
        `SUMMARY:${escapeIcs(getDisplayTitle(deadline))}`,
        `DESCRIPTION:${escapeIcs(`Kategori: ${getTypeLabel(deadline.type)}\\nPrioritas: ${deadline.priority}\\nStatus: ${deadline.status}\\nMatkul/kegiatan: ${deadline.course_name}`)}`,
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcs(`Reminder H-1: ${getDisplayTitle(deadline)}`)}`,
        'END:VALARM',
        'END:VEVENT'
      )
    })

    lines.push('END:VCALENDAR')
    downloadBlob(
      new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }),
      'nexa-deadlines.ics'
    )
    setMessage('File kalender berhasil diunduh.')
    setBusy(false)
  }

  function PremiumGate() {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-black">Export ini tersedia mulai NEXA Pulse.</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Radar tetap bisa download gambar. Upgrade ke Pulse atau Command untuk PDF summary dan
              file kalender.
            </p>
            <Link href="/dashboard/billing" className="mt-4 inline-flex">
              <Button type="button" variant="outline">
                Lihat Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto max-w-4xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brand-700">
              Share Deadline
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Export deadline kamu</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Buat story, rangkuman PDF, atau file kalender dari deadline aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Tutup modal export"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 pt-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-t-2xl border px-4 py-2 text-sm font-black transition ${
                  activeTab === id
                    ? 'border-slate-200 border-b-white bg-white text-slate-950'
                    : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'image' && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div
                ref={cardRef}
                className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl"
                style={{ width: '100%', minHeight: 520 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">
                      NEXA Campus
                    </p>
                    <h3 className="mt-3 text-3xl font-black tracking-tight">
                      Deadline 7 Hari Ke Depan
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-slate-300">
                      {userName || 'Mahasiswa'} · {humanDate()}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right">
                    <p className="text-2xl font-black text-teal-300">{imageDeadlines.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                      deadline
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {imageDeadlines.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
                      <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                      <p className="mt-4 text-xl font-black">7 hari ke depan aman.</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Tetap cek kanal resmi kampus ya.
                      </p>
                    </div>
                  ) : (
                    imageDeadlines.slice(0, 7).map((deadline) => {
                      const Icon = typeIcons[deadline.type]
                      const urgency = getUrgency(deadline)

                      return (
                        <div
                          key={deadline.id}
                          className="rounded-3xl border border-white/10 bg-white/[0.06] p-4"
                        >
                          <div className="flex gap-3">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-300 text-slate-950">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="min-w-0 flex-1 text-base font-black leading-6">
                                  {getDisplayTitle(deadline)}
                                </p>
                                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-black text-teal-100">
                                  {urgency.label}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-semibold text-slate-300">
                                {deadline.course_name}
                              </p>
                              <p className="mt-2 text-xs font-bold text-slate-400">
                                {formatDeadlineDate(deadline)} · {formatDeadlineTime(deadline)} ·{' '}
                                {getTypeLabel(deadline.type)} · {deadline.priority}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-bold text-slate-400">
                  <span>Generated by NEXA Campus</span>
                  <span>campus.nexatechlabs.my.id</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-black text-slate-950">Siap untuk story/status.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Gambar menangkap kartu gelap di sebelah kiri dan otomatis bernama `nexa-deadline-
                  {today}.png`.
                </p>
                <Button type="button" className="mt-4 w-full" onClick={exportImage} disabled={busy}>
                  <Download className="h-4 w-4" />
                  {busy ? 'Membuat...' : 'Download PNG'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'pdf' &&
            (canUsePremiumExport ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-black text-slate-950">PDF Summary</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Berisi tabel deadline aktif: No, Deadline, Kategori, Due Date, Prioritas, dan
                  Status.
                </p>
                <Button type="button" className="mt-4" onClick={exportPdf} disabled={busy}>
                  <Download className="h-4 w-4" />
                  {busy ? 'Membuat PDF...' : 'Download PDF'}
                </Button>
              </div>
            ) : (
              <PremiumGate />
            ))}

          {activeTab === 'calendar' &&
            (canUsePremiumExport ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-black text-slate-950">File Kalender (.ics)</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Setiap deadline menjadi event kalender dengan alarm H-1. Import ke Google
                  Calendar, Apple Calendar, atau kalender HP.
                </p>
                <Button type="button" className="mt-4" onClick={exportCalendar} disabled={busy}>
                  <Download className="h-4 w-4" />
                  {busy ? 'Membuat kalender...' : 'Download .ics'}
                </Button>
              </div>
            ) : (
              <PremiumGate />
            ))}

          {message && (
            <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-sm font-bold text-cyan-800">
              {message}
            </div>
          )}

          {exportDeadlines.length === 0 && activeTab !== 'image' && canUsePremiumExport && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
              Belum ada deadline aktif yang akan datang untuk diexport.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
