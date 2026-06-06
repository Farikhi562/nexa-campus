import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME = new Set([
  // Gambar
  'image/jpeg','image/png','image/webp','image/gif',
  // Video
  'video/mp4','video/webm','video/ogg','video/quicktime','video/3gpp','video/x-msvideo',
  // Dokumen
  'application/pdf','text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
])

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: membership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Kamu bukan member room ini.' }, { status: 403 })

  let formData: FormData
  try { formData = await request.formData() } catch { return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 }) }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File terlalu besar. Maksimal 10MB.' }, { status: 400 })
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({
      error: 'Tipe file tidak diizinkan. Kirim file belajar, bukan file mencurigakan dari planet antah-berantah.'
    }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${id}/${user.id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('room-attachments')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('room-attachments').getPublicUrl(path)

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  return NextResponse.json({
    data: {
      path,
      public_url: publicUrl,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      message_type: isImage ? 'image' : isVideo ? 'file' : 'file',
    }
  }, { status: 201 })
}
