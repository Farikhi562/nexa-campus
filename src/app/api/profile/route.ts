import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedGenders = new Set([
  '',
  'laki_laki',
  'perempuan',
  'lainnya',
  'tidak_ingin_menyebutkan',
])

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function visibility(value: unknown) {
  return value === 'private' ? 'private' : 'public'
}

function onlineVisibility(value: unknown) {
  return value === 'public' || value === 'private' ? value : 'friends'
}

function roomPresenceVisibility(value: unknown) {
  return value === 'private' ? 'private' : 'members'
}

function dmPrivacy(value: unknown) {
  return value === 'none' ? 'none' : 'friends'
}

function textList(value: unknown, maxItems = 12) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\n,]/) : []
  return Array.from(new Set(raw.map((item) => String(item).trim()).filter(Boolean))).slice(0, maxItems)
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
  const avatarIcon = text(body.avatar_icon, 40)
  const publicProfileHeadline = text(body.public_profile_headline, 120)
  const profileBio = text(body.profile_bio, 800)
  const profileSkills = textList(body.profile_skills, 16)
  const profileInterests = textList(body.profile_interests, 16)
  const portfolioUrl = text(body.portfolio_url, 500)
  const githubUrl = text(body.github_url, 500)
  const linkedinUrl = text(body.linkedin_url, 500)

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
    public_profile_headline: publicProfileHeadline || null,
    profile_bio: profileBio || null,
    profile_bio_visibility: visibility(body.profile_bio_visibility),
    profile_skills: profileSkills,
    profile_skills_visibility: visibility(body.profile_skills_visibility),
    profile_interests: profileInterests,
    profile_interests_visibility: visibility(body.profile_interests_visibility),
    portfolio_url: portfolioUrl || null,
    github_url: githubUrl || null,
    linkedin_url: linkedinUrl || null,
    online_status_visibility: onlineVisibility(body.online_status_visibility),
    study_room_presence_visibility: roomPresenceVisibility(body.study_room_presence_visibility),
    dm_privacy: dmPrivacy(body.dm_privacy),
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        ...fullPayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (error) {
    console.error('[Profile Update] full update failed:', error)

    if (isSchemaError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email ?? null,
            ...corePayload,
            is_public_profile: typeof body.is_public_profile === 'boolean' ? body.is_public_profile : true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
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
