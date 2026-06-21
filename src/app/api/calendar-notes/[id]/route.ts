import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: { id: string } }
type NotePatchPayload = {
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

function tableMissing(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === '42P01' || (/calendar_notes/i.test(error?.message || '') && /does not exist/i.test(error?.message || ''))
}

function parsePatch(body: NotePatchPayload) {
  const patch: Record<string, string> = {}

  if ('note_date' in body) {
    const noteDate = cleanText(body.note_date, 10)
    if (!isDateValue(noteDate)) return { error: 'Tanggal catatan tidak valid.' }
    patch.note_date = noteDate
  }

  if ('title' in body) {
    const title = cleanText(body.title, 80)
    if (!title) return { error: 'Judul catatan wajib diisi.' }
    patch.title = title
  }

  if ('content' in body) {
    const content = cleanText(body.content, 1000)
    if (!content) return { error: 'Isi catatan wajib diisi.' }
    patch.content = content
  }

  if (Object.keys(patch).length === 0) return { error: 'Tidak ada perubahan catatan.' }
  return { data: patch }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: NotePatchPayload
  try {
    body = (await request.json()) as NotePatchPayload
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const parsed = parsePatch(body)
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error || 'Request tidak valid.' }, { status: 400 })

  const { data, error } = await supabase
    .from('calendar_notes')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) {
    if (tableMissing(error)) return NextResponse.json({ error: 'Tabel calendar_notes belum tersedia.' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Catatan tidak ditemukan.' }, { status: 404 })

  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { error, count } = await supabase
    .from('calendar_notes')
    .delete({ count: 'exact' })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    if (tableMissing(error)) return NextResponse.json({ error: 'Tabel calendar_notes belum tersedia.' }, { status: 503 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!count) return NextResponse.json({ error: 'Catatan tidak ditemukan.' }, { status: 404 })

  return NextResponse.json({ data: { id: params.id } })
}
