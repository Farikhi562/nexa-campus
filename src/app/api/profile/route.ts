import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedGenders = new Set(['', 'laki_laki', 'perempuan', 'lainnya', 'tidak_ingin_menyebutkan'])

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const fullName = text(body.full_name)
  const campusName = text(body.campus_name)
  const province = text(body.province)
  const major = text(body.major)
  const semester = Number(body.semester)
  const studentId = text(body.student_id)
  const gender = text(body.gender)
  const avatarIcon = text(body.avatar_icon)

  if (!fullName) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 })
  if (!campusName) return NextResponse.json({ error: 'Nama kampus wajib diisi.' }, { status: 400 })
  if (!major) return NextResponse.json({ error: 'Jurusan wajib diisi.' }, { status: 400 })
  if (!Number.isFinite(semester) || semester < 1 || semester > 14) {
    return NextResponse.json({ error: 'Semester harus antara 1 sampai 14.' }, { status: 400 })
  }
  if (!allowedGenders.has(gender)) {
    return NextResponse.json({ error: 'Gender tidak valid.' }, { status: 400 })
  }

  const corePayload = {
    full_name: fullName,
    campus_name: campusName,
    major,
    semester,
    student_id: studentId || null,
  }

  const fullPayload = {
    ...corePayload,
    province: province || null,
    gender: gender || null,
    avatar_icon: avatarIcon || null,
    is_public_profile: typeof body.is_public_profile === 'boolean' ? body.is_public_profile : true,
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(fullPayload)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) {
    console.error('[Profile Update] full update failed:', error)

    if (isSchemaError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .update(corePayload)
        .eq('id', user.id)
        .select('*')
        .single()

      if (!fallbackError) {
        return NextResponse.json({
          data: fallbackData,
          warning:
            'Profil inti tersimpan, tapi field province/gender/avatar belum tersimpan karena migration profile terbaru belum jalan di Supabase production.',
        })
      }

      console.error('[Profile Update] fallback update failed:', fallbackError)
    }

    return NextResponse.json(
      {
        error: `Profil gagal disimpan: ${error.message}. Pastikan migration profile terbaru sudah jalan di Supabase.`,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
