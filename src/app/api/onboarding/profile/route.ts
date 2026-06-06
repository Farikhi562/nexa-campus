import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ProfilePayload = {
  full_name?: unknown
  campus_name?: unknown
  province?: unknown
  major?: unknown
  semester?: unknown
  gender?: unknown
  avatar_url?: unknown
  student_id?: unknown
  phone_number?: unknown
  telegram_chat_id?: unknown
  whatsapp_number?: unknown
}

const allowedGenders = new Set(['laki_laki', 'perempuan', 'lainnya', 'tidak_ingin_menyebutkan'])

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableText(value: unknown) {
  const text = cleanText(value)
  return text || null
}

function isSchemaError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? ''
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    message.includes('column') ||
    message.includes('schema cache')
  )
}

function isPlanConstraintError(error: { message?: string }) {
  return (error.message ?? '').toLowerCase().includes('profiles_plan_check')
}

function getSafeError(error: { message?: string }) {
  if (isPlanConstraintError(error)) {
    return 'Constraint plan di Supabase masih beda versi. Jalankan migration profile terbaru, lalu coba lagi.'
  }

  return 'Profil gagal disimpan. Cek migration profile di Supabase, lalu coba lagi.'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as ProfilePayload | null
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Payload profil tidak valid.' }, { status: 400 })
  }

  const fullName = cleanText(body.full_name)
  const campusName = cleanText(body.campus_name)
  const province = cleanText(body.province)
  const major = cleanText(body.major)
  const semester = Number(body.semester)
  const gender = cleanText(body.gender)

  if (!fullName) return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 })
  if (!campusName) return NextResponse.json({ error: 'Kampus wajib diisi.' }, { status: 400 })
  if (!province) return NextResponse.json({ error: 'Provinsi wajib dipilih.' }, { status: 400 })
  if (!major) return NextResponse.json({ error: 'Jurusan wajib dipilih.' }, { status: 400 })
  if (!Number.isFinite(semester) || semester < 1 || semester > 14) {
    return NextResponse.json({ error: 'Semester harus antara 1 sampai 14.' }, { status: 400 })
  }
  if (gender && !allowedGenders.has(gender)) {
    return NextResponse.json({ error: 'Pilihan gender tidak valid.' }, { status: 400 })
  }

  const corePayload = {
    id: user.id,
    email: user.email ?? '',
    full_name: fullName,
    campus_name: campusName,
    major,
    semester,
    student_id: nullableText(body.student_id),
    phone_number: nullableText(body.phone_number),
    telegram_chat_id: nullableText(body.telegram_chat_id),
    whatsapp_number: nullableText(body.whatsapp_number),
    profile_completed: true,
    updated_at: new Date().toISOString(),
  }

  const fullPayload = {
    ...corePayload,
    province,
    gender: gender || null,
    avatar_url: nullableText(body.avatar_url),
  }

  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (selectError && !isSchemaError(selectError)) {
    return NextResponse.json(
      { error: getSafeError(selectError), detail: selectError.message },
      { status: 400 }
    )
  }

  if (existingProfile?.id) {
    const firstUpdate = await supabase.from('profiles').update(fullPayload).eq('id', user.id)
    if (!firstUpdate.error) return NextResponse.json({ ok: true })

    if (isSchemaError(firstUpdate.error)) {
      const fallbackUpdate = await supabase.from('profiles').update(corePayload).eq('id', user.id)
      if (!fallbackUpdate.error)
        return NextResponse.json({
          ok: true,
          warning: 'Kolom profil opsional belum lengkap di database.',
        })
      return NextResponse.json(
        { error: getSafeError(fallbackUpdate.error), detail: fallbackUpdate.error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getSafeError(firstUpdate.error), detail: firstUpdate.error.message },
      { status: 400 }
    )
  }

  const insertAttempts = [
    fullPayload,
    corePayload,
    { ...fullPayload, plan: 'radar' },
    { ...corePayload, plan: 'radar' },
    { ...fullPayload, plan: 'free' },
    { ...corePayload, plan: 'free' },
  ]

  let lastError: { message?: string; code?: string } | null = null

  for (const payload of insertAttempts) {
    const { error } = await supabase.from('profiles').insert(payload)
    if (!error) return NextResponse.json({ ok: true })

    lastError = error

    const shouldTryNext =
      isSchemaError(error) ||
      isPlanConstraintError(error) ||
      error.message.toLowerCase().includes('null value in column "plan"')

    if (!shouldTryNext) break
  }

  return NextResponse.json(
    {
      error: lastError ? getSafeError(lastError) : 'Profil gagal disimpan.',
      detail: lastError?.message,
    },
    { status: 400 }
  )
}
