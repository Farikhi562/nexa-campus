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
}

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
  /** seberapa yakin sistem terhadap hasil ekstraksi ini */
  confidence: 'high' | 'medium' | 'low'
  /** field yang WAJIB dicek/diisi user sebelum disimpan */
  missing_fields: Array<'course_name' | 'deadline_date'>
}

export type ExtractSource = 'ai' | 'fallback' | 'error'

export type ExtractResult = {
  candidates: RawCandidate[]
  source: ExtractSource
  provider?: string
  model?: string
  error?: string
}
