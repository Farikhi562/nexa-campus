import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/documents
 * Fetch all documents for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(documents || [])
  } catch (err) {
    console.error('[Documents GET] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

/**
 * POST /api/documents
 * Create a new document entry (before upload)
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Upload Dokumen wajib melalui endpoint upload PDF yang tervalidasi.' },
    { status: 405 }
  )
}

/**
 * DELETE /api/documents?id=<docId>
 * Delete document and cascade delete questions and sessions
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')

    if (!docId) {
      return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 })
    }

    // Verify ownership
    const { data: doc } = await supabase
      .from('documents')
      .select('id, file_path')
      .eq('id', docId)
      .eq('user_id', userId)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    const serviceClient = createServiceClient()

    // Delete from storage
    if (doc.file_path) {
      await serviceClient.storage.from('documents').remove([doc.file_path])
    }

    // Delete questions (cascade by FK)
    await serviceClient.from('questions').delete().eq('document_id', docId)

    // Delete exam sessions related to this document
    const { data: sessions } = await serviceClient
      .from('exam_sessions')
      .select('id')
      .eq('document_id', docId)

    if (sessions?.length) {
      for (const session of sessions) {
        await serviceClient.from('session_answers').delete().eq('session_id', session.id)
      }
      await serviceClient.from('exam_sessions').delete().eq('document_id', docId)
    }

    // Delete document
    const { error } = await serviceClient.from('documents').delete().eq('id', docId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[Documents DELETE] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
