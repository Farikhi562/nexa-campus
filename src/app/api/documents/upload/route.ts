import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/types'
import type { Plan } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_PDF_SIZE = 10 * 1024 * 1024

function cleanPdfName(name: string) {
  const safeBase = name
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.replace(/\.pdf$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeBase || 'document'}.pdf`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const title = String(formData.get('title') || '').trim()

    if (!title) {
      return NextResponse.json({ error: 'Judul dokumen wajib diisi.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File PDF wajib diupload.' }, { status: 400 })
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      return NextResponse.json({ error: 'Hanya file PDF yang didukung.' }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'File PDF kosong.' }, { status: 400 })
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar. Maksimal 10 MB.' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan ?? 'free') as Plan
    const limits = PLAN_LIMITS[plan]

    if (limits.maxDocuments !== null) {
      const { count } = await serviceClient
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((count ?? 0) >= limits.maxDocuments) {
        return NextResponse.json(
          {
            error: `Paket ${plan} hanya memperbolehkan ${limits.maxDocuments} dokumen. Upgrade untuk menambah dokumen.`,
          },
          { status: 403 }
        )
      }
    }

    const filePath = `${user.id}/${Date.now()}_${cleanPdfName(file.name)}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: storageError } = await serviceClient.storage
      .from('documents')
      .upload(filePath, bytes, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (storageError) {
      console.error('[Documents upload] Storage error:', storageError)
      return NextResponse.json(
        { error: `Upload gagal: ${storageError.message}` },
        { status: 500 }
      )
    }

    const { data: doc, error: insertError } = await serviceClient
      .from('documents')
      .insert({
        user_id: user.id,
        title,
        file_path: filePath,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !doc) {
      await serviceClient.storage.from('documents').remove([filePath])
      console.error('[Documents upload] Insert error:', insertError)
      return NextResponse.json(
        { error: insertError?.message || 'Gagal menyimpan dokumen.' },
        { status: 500 }
      )
    }

    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    console.error('[Documents upload] Error:', err)
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
