// ============================================================
// DIKTAT.AI — PDF Export (client-side, jsPDF)
// ============================================================
'use client'

import type { ExamSession, Question, SessionAnswer } from '@/types'

interface ExportData {
  session: ExamSession
  answers: Array<SessionAnswer & { question: Question }>
  userName: string
  documentTitle: string
}

/**
 * Generate and download a PDF result report.
 * Only callable from client (browser) context.
 */
export async function exportResultsToPdf(data: ExportData): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const { session, answers, userName, documentTitle } = data
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PRIMARY = [90, 98, 246]   // #5a62f6 brand-500
  const DARK    = [26, 24, 78]    // brand-950
  const GRAY    = [107, 114, 128]

  // ── Header ──────────────────────────────────
  doc.setFillColor(...(PRIMARY as [number, number, number]))
  doc.rect(0, 0, 210, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('DIKTAT.AI', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Laporan Hasil Mock Exam', 14, 24)
  doc.text(new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }), 14, 31)

  // ── Score badge ──────────────────────────────
  const score = session.score ?? 0
  const badgeColor: [number,number,number] = score >= 75 ? [34,197,94] : score >= 50 ? [251,191,36] : [239,68,68]
  doc.setFillColor(...badgeColor)
  doc.roundedRect(150, 8, 50, 22, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(`${score}`, 175, 22, { align: 'center' })
  doc.setFontSize(8)
  doc.text('SKOR', 175, 27, { align: 'center' })

  // ── Info block ───────────────────────────────
  doc.setTextColor(...(DARK as [number,number,number]))
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Informasi Ujian', 14, 50)

  const infoY = 56
  const infoData = [
    ['Nama',          userName],
    ['Dokumen',       documentTitle],
    ['Total Soal',    String(session.total_questions)],
    ['Benar',         String(session.correct_count ?? 0)],
    ['Salah',         String((session.total_questions) - (session.correct_count ?? 0))],
    ['Waktu',         session.time_taken_seconds ? `${Math.floor(session.time_taken_seconds / 60)} menit ${session.time_taken_seconds % 60} detik` : '-'],
    ['Selesai',       session.completed_at ? new Date(session.completed_at).toLocaleString('id-ID') : '-'],
  ]

  infoData.forEach(([label, value], i) => {
    const y = infoY + i * 7
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...(GRAY as [number,number,number]))
    doc.setFontSize(9)
    doc.text(label, 14, y)
    doc.setTextColor(...(DARK as [number,number,number]))
    doc.setFontSize(10)
    doc.text(value, 60, y)
  })

  // ── Answers table ────────────────────────────
  const tableStartY = infoY + infoData.length * 7 + 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...(DARK as [number,number,number]))
  doc.text('Detail Jawaban', 14, tableStartY)

  const tableRows = answers.map((a, idx) => [
    String(idx + 1),
    a.question.question_text.length > 80
      ? a.question.question_text.slice(0, 77) + '...'
      : a.question.question_text,
    a.selected_answer ?? '–',
    a.question.correct_answer,
    a.is_correct ? '✓' : '✗',
  ])

  autoTable(doc, {
    startY: tableStartY + 4,
    head: [['No', 'Pertanyaan', 'Jawaban Kamu', 'Jawaban Benar', 'Status']],
    body: tableRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: PRIMARY as [number,number,number],
      textColor: [255,255,255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
    },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === 'body') {
        const val = data.cell.text[0]
        data.cell.styles.textColor = val === '✓' ? [34,197,94] : [239,68,68]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // ── Footer ───────────────────────────────────
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...(GRAY as [number,number,number]))
    doc.text('NEXA Campus Ecosystem - Platform mahasiswa terpadu', 14, 290)
    doc.text(`Hal ${i} / ${pageCount}`, 196, 290, { align: 'right' })
  }

  // ── Download ─────────────────────────────────
  const filename = `nexa-campus-hasil-${new Date().toISOString().slice(0,10)}.pdf`
  doc.save(filename)
}
