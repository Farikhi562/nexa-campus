import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText, aiConfigured } from '@/lib/ai/llm'
import { parseDeadlinePayload } from '@/lib/deadline-validation'

/**
 * Quick Add 1 baris (natural language).
 * Contoh input: "tugas kalkulus bab 3 jumat jam 5 sore di vclass"
 * Alur: teks bebas -> AI/fallback parse -> lengkapi default wajib -> validasi -> insert.
 */

const TYPES = ['tugas', 'praktikum', 'kuis', 'ujian', 'presentasi', 'administrasi', 'pembayaran', 'organisasi', 'lainnya']
const SOURCES = ['vclass', 'ilab', 'dosen_langsung', 'grup_wa', 'praktikum', 'studentsite', 'baak', 'lepkom', 'lainnya']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']

const MONTHS_ID: Record<string, number> = {
  januari: 1, jan: 1, februari: 2, feb: 2, maret: 3, mar: 3, april: 4, apr: 4, mei: 5,
  juni: 6, jun: 6, juli: 7, jul: 7, agustus: 8, agu: 8, ags: 8, september: 9, sep: 9,
  oktober: 10, okt: 10, november: 11, nov: 11, desember: 12, des: 12,
}
const DOW_ID: Record<string, number> = {
  minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, "jum'at": 5, sabtu: 6,
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Parser lokal (dipakai kalau AI tidak aktif / gagal). Cukup pintar untuk kasus umum.
function localParse(textRaw: string) {
  const text = textRaw.toLowerCase()
  const today = new Date()
  const year = today.getFullYear()

  let date: string | null = null
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  const dmy = text.match(/\b(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?\b/)
  const named = text.match(/\b(\d{1,2})\s+([a-z]+)\b/)

  if (iso) date = `${iso[1]}-${iso[2]}-${iso[3]}`
  else if (dmy) {
    const d = +dmy[1], m = +dmy[2]; let y = dmy[3] ? +dmy[3] : year
    if (y < 100) y += 2000
    if (d <= 31 && m <= 12) date = `${y}-${pad(m)}-${pad(d)}`
  } else if (named && MONTHS_ID[named[2]]) {
    date = `${year}-${pad(MONTHS_ID[named[2]])}-${pad(+named[1])}`
  } else if (/\bhari ini\b/.test(text)) date = isoDate(today)
  else if (/\bbesok\b/.test(text)) date = isoDate(new Date(today.getTime() + 864e5))
  else if (/\blusa\b/.test(text)) date = isoDate(new Date(today.getTime() + 2 * 864e5))
  else {
    for (const [name, dow] of Object.entries(DOW_ID)) {
      if (text.includes(name)) {
        const diff = (dow - today.getDay() + 7) % 7 || 7
        date = isoDate(new Date(today.getTime() + diff * 864e5))
        break
      }
    }
  }

  // Jam: "jam 17", "17:00", "jam 5 sore", "jam 9 pagi"
  let time = '23:59'
  const hm = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  const jam = text.match(/jam\s+(\d{1,2})(?:[.:](\d{2}))?\s*(pagi|siang|sore|malam)?/)
  if (hm) time = `${pad(+hm[1])}:${hm[2]}`
  else if (jam) {
    let h = +jam[1]
    const min = jam[2] ? +jam[2] : 0
    const part = jam[3]
    if (part === 'sore' || part === 'malam') { if (h < 12) h += 12 }
    if (part === 'siang' && h < 12 && h !== 12) h += 0
    if (h > 23) h = 23
    time = `${pad(h)}:${pad(min)}`
  }

  let type = 'tugas'
  if (/\b(uts|uas|ujian)\b/.test(text)) type = 'ujian'
  else if (/\bpraktikum|lab\b/.test(text)) type = 'praktikum'
  else if (/\bkuis|quiz\b/.test(text)) type = 'kuis'
  else if (/\bpresentasi|presentation|sidang\b/.test(text)) type = 'presentasi'
  else if (/\bbayar|pembayaran|spp|ukt\b/.test(text)) type = 'pembayaran'
  else if (/\borganisasi|rapat|meeting\b/.test(text)) type = 'organisasi'

  let source = 'lainnya'
  if (/\bvclass\b/.test(text)) source = 'vclass'
  else if (/\bilab\b/.test(text)) source = 'ilab'
  else if (/\bgrup wa|grup whatsapp|wa\b/.test(text)) source = 'grup_wa'
  else if (/\bdosen\b/.test(text)) source = 'dosen_langsung'
  else if (/\bstudentsite\b/.test(text)) source = 'studentsite'
  else if (/\bbaak\b/.test(text)) source = 'baak'
  else if (/\blepkom\b/.test(text)) source = 'lepkom'

  const priority = /\burgent|penting banget|deadline hari ini\b/.test(text)
    ? 'urgent'
    : /\bpenting|high\b/.test(text)
      ? 'high'
      : 'normal'

  const online = /\bonline|daring|vclass|ilab|zoom|gmeet\b/.test(text)

  // course_name: ambil teks setelah keyword tipe, atau seluruh kalimat dibersihkan.
  const course = textRaw
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/\b\d{1,2}[/\-.]\d{1,2}(?:[/\-.]\d{2,4})?\b/g, '')
    .replace(/jam\s+\d{1,2}([.:]\d{2})?\s*(pagi|siang|sore|malam)?/gi, '')
    .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, '')
    .replace(/\b(hari ini|besok|lusa|senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return {
    title: null as string | null,
    course_name: course || textRaw.trim(),
    type,
    source,
    deadline_date: date,
    deadline_time: time,
    priority,
    online,
  }
}

const AI_SYSTEM =
  `Kamu parser deadline mahasiswa Indonesia. Dari satu kalimat, keluarkan JSON object:
{"title":string|null,"course_name":string,"type":one of ${TYPES.join('|')},"source":one of ${SOURCES.join('|')},"deadline_date":"YYYY-MM-DD"|null,"deadline_time":"HH:MM","priority":one of ${PRIORITIES.join('|')},"online":boolean}
Aturan: kalau jam tidak disebut, pakai "23:59". Kalau tipe/sumber tidak jelas pakai "tugas"/"lainnya". Hari ini = tanggal sekarang. Respond ONLY JSON object.`

function safeParseObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const o = JSON.parse(cleaned)
    if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, unknown>
  } catch {
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}')
    if (s >= 0 && e > s) {
      try {
        const o = JSON.parse(cleaned.slice(s, e + 1))
        if (o && typeof o === 'object') return o as Record<string, unknown>
      } catch { /* ignore */ }
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: { text?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'Ketik dulu deadline-nya, misal: "tugas kalkulus jumat jam 5 sore".' }, { status: 400 })
  if (text.length > 500) return NextResponse.json({ error: 'Kepanjangan, ringkas dulu ya.' }, { status: 400 })

  // Default kampus dari profil (biar field wajib "campus" terisi otomatis).
  const { data: profile } = await supabase
    .from('profiles')
    .select('campus_name')
    .eq('id', user.id)
    .maybeSingle()
  const defaultCampus = (profile?.campus_name as string) || 'Kampus'

  // 1) Coba AI dulu (kalau aktif), fallback ke parser lokal.
  let parsed = localParse(text)
  if (aiConfigured()) {
    try {
      const today = new Date()
      const { text: aiRaw } = await generateText({
        system: AI_SYSTEM,
        user: `Tanggal hari ini: ${isoDate(today)}.\nKalimat: ${text}`,
        temperature: 0.1,
        maxTokens: 300,
        json: true,
      })
      const obj = safeParseObject(aiRaw)
      if (obj) {
        parsed = {
          title: typeof obj.title === 'string' ? obj.title : null,
          course_name: typeof obj.course_name === 'string' && obj.course_name.trim() ? obj.course_name.trim() : parsed.course_name,
          type: TYPES.includes(String(obj.type)) ? String(obj.type) : parsed.type,
          source: SOURCES.includes(String(obj.source)) ? String(obj.source) : parsed.source,
          deadline_date: /^\d{4}-\d{2}-\d{2}$/.test(String(obj.deadline_date)) ? String(obj.deadline_date) : parsed.deadline_date,
          deadline_time: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(obj.deadline_time)) ? String(obj.deadline_time) : parsed.deadline_time,
          priority: PRIORITIES.includes(String(obj.priority)) ? String(obj.priority) : parsed.priority,
          online: typeof obj.online === 'boolean' ? obj.online : parsed.online,
        }
      }
    } catch {
      // pakai hasil localParse
    }
  }

  if (!parsed.deadline_date) {
    return NextResponse.json({
      error: 'Tanggalnya belum kebaca. Sebutkan tanggal/harinya, misal "besok", "jumat", atau "20 Juni".',
      partial: parsed,
    }, { status: 422 })
  }

  // 2) Lengkapi field wajib + validasi pakai validator yang sama dengan form.
  const payload = {
    title: parsed.title,
    course_name: parsed.course_name,
    type: parsed.type,
    source: parsed.source,
    deadline_date: parsed.deadline_date,
    deadline_time: parsed.deadline_time,
    campus: defaultCampus,
    room: parsed.online ? 'Online' : 'Menyusul',
    priority: parsed.priority,
    status: 'pending',
    reminder_enabled: true,
  }

  const result = parseDeadlinePayload(payload)
  if ('error' in result) {
    return NextResponse.json({ error: result.error, partial: parsed }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('academic_deadlines')
    .insert({ ...result.data, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    parsed,
    notice: parsed.online ? null : 'Ruangan diisi "Menyusul" — edit kalau perlu.',
  }, { status: 201 })
}
