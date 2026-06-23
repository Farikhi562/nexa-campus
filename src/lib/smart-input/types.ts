import type { DeadlinePriority, DeadlineSource, DeadlineType } from '@/types'

/**
 * Bentuk "mentah" hasil ekstraksi AI/parser lokal — semua field longgar (unknown)
 * karena bisa datang dari JSON AI yang tidak selalu rapi.
 */
export type RawCandidate = {
  title?: unknown
  course_name?: unknown
  type?: unknown
  source?: unknown
  deadline_date?: unknown
  deadline_time?: unknown
  priority?: unknown
  notes?: unknown
  online?: unknown
  /** Lokasi/ruangan/platform yang disebutkan eksplisit. */
  location?: unknown
  /** true jika terdeteksi pola jadwal berulang ("setiap senin", "tiap minggu"). */
  is_recurring?: unknown
  /** 0=Min..6=Sab, diisi kalau is_recurring=true dan hari spesifik disebutkan. */
  recurrence_day_of_week?: unknown
  /** Potongan teks asli yang menjadi dasar parsing kandidat ini (transparansi). */
  evidence?: unknown
  /** Menit sebelum deadline untuk reminder, dari "ingatkan 2 jam sebelum" → 120. */
  reminder_offset_minutes?: unknown
}

/** Klasifikasi maksud utama dari input Smart Input. */
export type SmartInputIntent = 'deadline' | 'schedule' | 'reminder' | 'study' | 'mixed' | 'unknown'

/**
 * Kandidat yang sudah dinormalisasi & siap ditampilkan di Smart Preview.
 * Field ini 1:1 dengan DeadlinePayload (lib/deadline-validation.ts) ditambah
 * metadata UI (confidence, missing_fields).
 */
export type SmartInputCandidate = {
  title: string | null
  course_name: string
  type: DeadlineType
  source: DeadlineSource
  deadline_date: string | null
  deadline_time: string
  campus: string
  room: string
  notes: string | null
  priority: DeadlinePriority
  reminder_enabled: boolean
  is_recurring: boolean
  recurrence_day_of_week: number | null
  /** Menit sebelum deadline untuk reminder (mis. 120 = 2 jam sebelum). null = pakai default. */
  reminder_offset_minutes: number | null
  /** Potongan teks asli yang jadi dasar parsing — ditampilkan ke user biar transparan. */
  evidence: string | null
  /** Asumsi yang AI/parser ambil (mis. "Jam default 23:59", "Ruangan belum disebut"). */
  assumptions: string[]
  /** seberapa yakin sistem terhadap hasil ekstraksi ini */
  confidence: 'high' | 'medium' | 'low'
  /** field yang WAJIB dicek/diisi user sebelum disimpan */
  missing_fields: Array<'course_name' | 'deadline_date'>
}

export type ExtractSource = 'ai' | 'fallback' | 'error'

export type ExtractResult = {
  candidates: RawCandidate[]
  source: ExtractSource
  /** Maksud utama input — diisi kalau bisa diklasifikasi (default 'unknown'). */
  intent?: SmartInputIntent
  provider?: string
  model?: string
  error?: string
}
