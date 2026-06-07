import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_SIZE = 50 * 1024 * 1024
const ALLOWED_MIME = new Set([
  'image/jpeg','image/png','image/webp','image/gif',
  'video/mp4','video/webm','video/ogg','video/quicktime','video/3gpp',
  'application/pdf','text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
])

type Params = { params: Promise<{ friendId: string }> }


async function areFriends(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, friendId: string) {
  const { data } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(requester_id.eq.${userId},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${userId})`)
    .maybeSingle()
  return Boolean(data)
}


export async function POST(request: NextRequest, { params }: Params) {
  const { friendId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  if (!await areFriends(supabase, user.id, friendId)) return NextResponse.json({ error: 'Upload chat hanya untuk teman.' }, { status: 403 })

  const { data: friend } = await supabase.from('profiles').select('dm_privacy').eq('id', friendId).maybeSingle()
  if ((friend as { dm_privacy?: string } | null)?.dm_privacy === 'none') return NextResponse.json({ error: 'User ini mematikan chat pribadi.' }, { status: 403 })

  let formData: FormData
  try { formData = await request.formData() } catch { return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 }) }
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File terlalu besar. Maksimal 50MB.' }, { status: 400 })
  if (!ALLOWED_MIME.has(file.type)) return NextResponse.json({ error: 'Tipe file tidak diizinkan.' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'bin'
  const pair = [user.id, friendId].sort().join('_')
  const path = `${pair}/${user.id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('private-chat-attachments')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('private-chat-attachments').getPublicUrl(path)
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  return NextResponse.json({
    data: { path, public_url: publicUrl, filename: file.name, file_size: file.size, mime_type: file.type, message_type: isImage ? 'image' : isVideo ? 'video' : 'file' }
  }, { status: 201 })
}
