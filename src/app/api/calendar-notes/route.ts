import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type NotePayload = {
  note_date?: unknown
  title?: unknown
  content?: unknown
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function isDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function dateTime(value: string) {
  return new Date(`${value}T00:00:00.000Z`).getTime()
}

function tableMissing(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === '42P01' || (/calendar_notes/i.test(error?.message || '') && /does not exist/i.test(error?.message || ''))
}

function validateRange(from: string, to: string) {
  if (!isDateValue(from) || !isDateValue(to)) return 'Range tanggal tidak valid.'
  if (dateTime(from) > dateTime(to)) return 'Tanggal awal tidak boleh lebih besar dari tanggal akhir.'
  const maxRange = 370 * 24 * 60 * 60 * 1000
  if (dateTime(to) - dateTime(from) > maxRange) return 'Range catatan kalender terlalu panjang.'
  return ''
}

function parsePayload(body: NotePayload) {
  const noteDate = cleanText(body.note_date, 10)
  const title = cleanText(body.title, 80) || 'Catatan'
  const content = cleanText(body.content, 1000)

  if (!isDateValue(noteDate)) return { error: 'Tanggal catatan tidak valid.' }
  if (!title) return { error: 'Judul catatan wajib diisi.' }
  if (!content) return { error: 'Isi catatan wajib diisi.' }
  if (title.length > 80) return { error: 'Judul catatan maksimal 80 karakter.' }
  if (content.length > 1000) return { error: 'Isi catatan maksimal 1000 karakter.' }

  return {
    data: {
      note_date: noteDate,
      title,
      content,
    },
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const url = new URL(request.url)
  const today = new Date()
  const fallbackFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const fallbackTo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-31`
  const from = cleanText(url.searchParams.get('from'), 10) || fallbackFrom
  const to = cleanText(url.searchParams.get('to'), 10) || fallbackTo
  const rangeError = validateRange(from, to)
  if (rangeError) return NextResponse.json({ error: rangeError }, { status: 400 })

  const { data, error } = await supabase
    .from('calendar_notes')
    .select('*')
    .eq('user_id', user.id)
    .gte('note_date', from)
    .lte('note_date', to)
    .order('note_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    if (tableMissing(error)) return NextResponse.json({ data: [], setupRequired: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: NotePayload
  try {
    body = (await request.json()) as NotePayload
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const parsed = parsePayload(body)
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error || 'Request tidak valid.' }, { status: 400 })

  const { data, error } = await supabase
    .from('calendar_notes')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select('*')
    .single()

  if (error) {
    if (tableMissing(error)) {
      return NextResponse.json({ error: 'Tabel calendar_notes belum tersedia. Jalankan migration kalender notes dulu.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
