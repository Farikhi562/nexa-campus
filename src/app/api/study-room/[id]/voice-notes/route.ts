import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canUseFeature } from '@/lib/billing/access'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'

const BUCKET = 'study-room-voice-notes'
const MAX_AUDIO_BYTES = 10 * 1024 * 1024

type RouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

function sanitizeRoomId(roomId: string) {
  return roomId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120) || 'general'
}

async function requireCommandAccess() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  if (!user) {
    return { error: NextResponse.json({ error: 'Login dulu buat akses voice note.' }, { status: 401 }) }
  }

  const access = await getUserPlanAccess({ supabase, user })
  const plan = access?.plan ?? 'radar'
  if (!canUseFeature(plan, 'study_room_voice_video')) {
    return { error: NextResponse.json({ error: 'Voice note Study Room khusus NEXA Command.' }, { status: 403 }) }
  }

  return { user, access }
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params
  const guard = await requireCommandAccess()
  if ('error' in guard) return guard.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('study_room_voice_notes')
    .select('id,room_id,user_id,file_url,duration_seconds,mime_type,created_at,profiles(full_name,name,email,avatar_url)')
    .eq('room_id', resolvedParams.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ voiceNotes: data || [] })
}

export async function POST(req: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params
  const guard = await requireCommandAccess()
  if ('error' in guard) return guard.error

  const formData = await req.formData()
  const audio = formData.get('audio')
  const duration = Number(formData.get('duration') || 0)

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'File audio tidak ditemukan.' }, { status: 400 })
  }

  if (!audio.type.startsWith('audio/')) {
    return NextResponse.json({ error: 'File harus audio.' }, { status: 400 })
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Voice note maksimal 10MB.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const roomId = sanitizeRoomId(resolvedParams.id)
  const extension = audio.type.includes('mp4') ? 'm4a' : audio.type.includes('ogg') ? 'ogg' : 'webm'
  const path = `${roomId}/${guard.user.id}/${Date.now()}.${extension}`
  const buffer = Buffer.from(await audio.arrayBuffer())

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: audio.type || 'audio/webm',
    upsert: false,
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)
  const fileUrl = urlData.publicUrl

  const { data, error } = await admin
    .from('study_room_voice_notes')
    .insert({
      room_id: resolvedParams.id,
      user_id: guard.user.id,
      file_path: path,
      file_url: fileUrl,
      duration_seconds: Number.isFinite(duration) ? Math.max(0, Math.floor(duration)) : 0,
      mime_type: audio.type || 'audio/webm',
    })
    .select('id,room_id,user_id,file_url,duration_seconds,mime_type,created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ voiceNote: data })
}
