import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const BUCKET = 'profile-photos'
const MAX_FILE_SIZE = 2 * 1024 * 1024
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Upload tidak valid.' }, { status: 400 })
  }

  const file = formData.get('photo')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Pilih file foto dulu.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Ukuran foto maksimal 2MB.' }, { status: 400 })
  }

  const extension = allowedTypes.get(file.type)
  if (!extension) {
    return NextResponse.json({ error: 'Format foto harus JPG, PNG, WebP, atau GIF.' }, { status: 400 })
  }

  const service = createServiceClient()
  const path = `${user.id}/avatar-${Date.now()}.${extension}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Foto gagal diupload. Cek bucket profile-photos di Supabase.' }, { status: 500 })
  }

  const { data: publicUrlData } = service.storage.from(BUCKET).getPublicUrl(path)
  const avatarUrl = publicUrlData.publicUrl

  const { error: updateError } = await service
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
    })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Foto terupload, tapi profil gagal diupdate.' }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: avatarUrl })
}
