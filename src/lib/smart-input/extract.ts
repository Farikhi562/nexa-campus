import 'server-only'
import { generateText, generateFromImage, aiConfigured, activeProviderInfo, LlmFailure } from '@/lib/ai/llm'
import { localParseText } from './local-parser'
import type { ExtractResult, RawCandidate } from './types'

const TYPES = ['tugas', 'praktikum', 'kuis', 'ujian', 'presentasi', 'administrasi', 'pembayaran', 'organisasi', 'lainnya']
const SOURCES = ['vclass', 'ilab', 'dosen_langsung', 'grup_wa', 'praktikum', 'studentsite', 'baak', 'lepkom', 'lainnya']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Batas waktu panggilan AI. Kalau provider hang/lambat, kita TIDAK biarkan
// user stuck di spinner — fallback ke parser lokal (untuk teks) atau pesan
// error yang jelas (untuk gambar, yang tidak punya fallback non-AI).
const TEXT_AI_TIMEOUT_MS = 15_000
const IMAGE_AI_TIMEOUT_MS = 25_000

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(`AI timeout after ${ms}ms`)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) }
    )
  })
}

const SYSTEM_PROMPT = `Kamu adalah Smart Input Engine untuk NEXA Campus — parser tugas/deadline mahasiswa Indonesia.
Dari teks yang diberikan (bisa berisi 1 atau banyak info tugas/jadwal/ujian/pembayaran), keluarkan JSON ARRAY.
Tiap item punya field:
{
  "title": string|null,            // judul SPESIFIK tugas kalau disebutkan terpisah dari nama matkul, mis. teks "Tugas Kalkulus: Laporan Praktikum Modul 3" -> title="Laporan Praktikum Modul 3". Null kalau tidak ada judul spesifik selain nama matkul.
  "course_name": string,            // nama mata kuliah/kegiatan SAJA (WAJIB, jangan kosong, jangan dicampur dengan judul tugas atau ruangan)
  "type": one of ${TYPES.join('|')},
  "source": one of ${SOURCES.join('|')},
  "deadline_date": "YYYY-MM-DD"|null,  // null kalau tanggal TIDAK disebut/tidak jelas, JANGAN MENEBAK
  "deadline_time": "HH:MM",         // default "23:59" kalau jam tidak disebut
  "priority": one of ${PRIORITIES.join('|')},
  "notes": string|null,             // instruksi/catatan tambahan kalau ada
  "online": boolean,                // true kalau jelas online/daring/vclass/zoom
  "location": string|null           // ruangan/gedung/lab/platform yang DISEBUTKAN EKSPLISIT, mis. "Ruang B204", "Lab Komputer 2", "Zoom", "Google Meet". Null kalau tidak disebutkan sama sekali -- JANGAN MENEBAK.
}
Aturan: hari ini = tanggal yang diberikan di prompt. Kalau teks tidak berisi info tugas sama sekali, kembalikan array kosong [].
Respond ONLY with the JSON array, no markdown, no commentary.`

const SYSTEM_PROMPT_IMAGE = `Kamu adalah Smart Input Engine untuk NEXA Campus. Baca gambar (screenshot WA, LMS/VClass, Google Classroom, papan tulis, jadwal kelas, atau pesan dosen) dan ekstrak semua tugas/deadline/jadwal yang terlihat.
Keluarkan JSON ARRAY dengan format yang sama seperti di atas:
[{"title":string|null,"course_name":string,"type":one of ${TYPES.join('|')},"source":one of ${SOURCES.join('|')},"deadline_date":"YYYY-MM-DD"|null,"deadline_time":"HH:MM","priority":one of ${PRIORITIES.join('|')},"notes":string|null,"online":boolean,"location":string|null}]
"title" = judul spesifik tugas terpisah dari nama matkul (lihat aturan di atas), null kalau tidak ada.
"location" = ruangan/gedung/lab/platform yang TERLIHAT JELAS di gambar (mis. jadwal kelas fisik sering mencantumkan nomor ruangan) -- ambil PERSIS seperti tertulis, JANGAN MENEBAK kalau tidak terlihat jelas.
Kalau tanggal di gambar tidak lengkap/tidak jelas, deadline_date = null (jangan menebak tahun/bulan). Kalau gambar tidak berisi info tugas, kembalikan [].
Respond ONLY with the JSON array.`

function safeParseArray(raw: string): RawCandidate[] | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed as RawCandidate[]
    if (parsed && typeof parsed === 'object') {
      for (const key of ['candidates', 'deadlines', 'data', 'items', 'result']) {
        const maybe = (parsed as Record<string, unknown>)[key]
        if (Array.isArray(maybe)) return maybe as RawCandidate[]
      }
    }
  } catch {
    // try bracket extraction below
  }

  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1))
      if (Array.isArray(parsed)) return parsed as RawCandidate[]
    } catch {
      // give up
    }
  }
  return null
}

/**
 * Ekstrak kandidat deadline dari teks bebas. Kalau AI tidak aktif/gagal/hasilnya
 * kosong, fallback otomatis ke parser lokal (local-parser.ts) — flow TIDAK PERNAH
 * mengembalikan error keras ke user untuk input teks.
 */
export async function extractFromText(text: string): Promise<ExtractResult> {
  if (!aiConfigured()) {
    return { candidates: localParseText(text), source: 'fallback' }
  }

  try {
    const today = isoDate(new Date())
    const { text: raw, provider, model } = await withTimeout(
      generateText({
        system: SYSTEM_PROMPT,
        user: `Tanggal hari ini: ${today}.\n\nTeks:\n${text}`,
        temperature: 0.1,
        maxTokens: 1200,
        json: true,
      }),
      TEXT_AI_TIMEOUT_MS
    )

    const arr = safeParseArray(raw)
    if (!arr || arr.length === 0) {
      const fallback = localParseText(text)
      return { candidates: fallback, source: fallback.length > 0 ? 'fallback' : 'ai', provider, model }
    }
    return { candidates: arr, source: 'ai', provider, model }
  } catch (err) {
    // Termasuk TimeoutError — tetap fallback ke parser lokal, jangan biarkan
    // user menunggu tanpa hasil.
    if (err instanceof TimeoutError) {
      console.warn('[smart-input] AI parse-text timeout, fallback ke parser lokal.')
    }
    return { candidates: localParseText(text), source: 'fallback' }
  }
}

/**
 * Ekstrak kandidat deadline dari gambar (vision AI). Tidak ada fallback lokal
 * untuk gambar (OCR lokal tidak realistis) — kalau AI tidak tersedia/tidak
 * mendukung vision, kembalikan `source: 'error'` dengan pesan ramah supaya
 * UI bisa mengarahkan user ke tab Manual.
 */
export async function extractFromImage(base64: string, mimeType: string): Promise<ExtractResult> {
  if (!aiConfigured()) {
    return { candidates: [], source: 'error', error: 'AI belum aktif di server. Coba input manual atau Bahasa Natural dulu.' }
  }

  const info = activeProviderInfo()
  if (!info.supportsVision) {
    return {
      candidates: [],
      source: 'error',
      error: `Provider AI aktif (${info.provider}) belum bisa baca gambar. Coba input manual atau Bahasa Natural.`,
    }
  }

  try {
    const { text: raw, provider, model } = await withTimeout(
      generateFromImage({
        system: SYSTEM_PROMPT_IMAGE,
        prompt: 'Extract semua tugas/deadline dari gambar ini.',
        base64,
        mimeType,
        temperature: 0.1,
        maxTokens: 1200,
        json: true,
      }),
      IMAGE_AI_TIMEOUT_MS
    )

    const arr = safeParseArray(raw)
    if (!arr) {
      return { candidates: [], source: 'error', error: 'AI tidak mengembalikan hasil yang bisa dibaca. Coba foto yang lebih jelas.', provider, model }
    }
    return { candidates: arr, source: 'ai', provider, model }
  } catch (err) {
    if (err instanceof TimeoutError) {
      return { candidates: [], source: 'error', error: 'AI butuh waktu terlalu lama membaca gambar ini. Coba foto yang lebih kecil/jelas, atau pakai input Manual/Bahasa Natural.' }
    }
    if (err instanceof LlmFailure) {
      return { candidates: [], source: 'error', error: `AI gagal membaca gambar (${err.info.code}). Coba lagi atau pakai input manual.` }
    }
    return { candidates: [], source: 'error', error: 'AI sedang tidak bisa membaca gambar. Coba lagi sebentar.' }
  }
}
