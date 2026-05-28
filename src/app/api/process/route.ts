import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ocrFromUrl } from '@/lib/ocr'
import { extractQuestions } from '@/lib/openai'

export const maxDuration = 60 // 60s timeout

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'documentId wajib diisi.' }, { status: 400 })
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, file_path, status')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    if (doc.status !== 'processing' && doc.status !== 'pending') {
      return NextResponse.json({ error: 'Dokumen tidak dalam status siap diproses.' }, { status: 409 })
    }

    if (!doc.file_path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Path dokumen tidak valid.' }, { status: 403 })
    }

    // Use service client to bypass RLS for storage signed URL
    const serviceClient = createServiceClient()

    // Get signed URL for the uploaded PDF
    const { data: signedUrlData, error: signedUrlError } = await serviceClient
      .storage
      .from('documents')
      .createSignedUrl(doc.file_path, 60) // 1 min expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      await serviceClient.from('documents').update({
        status: 'error',
        error_message: 'Gagal mengakses file. Coba upload ulang.',
      }).eq('id', doc.id)

      return NextResponse.json({ error: 'Gagal mendapatkan URL file.' }, { status: 500 })
    }

    // Step 1: OCR
    console.log(`[Process] Starting OCR for doc ${documentId}`)
    const ocrResult = await ocrFromUrl(signedUrlData.signedUrl)

    if (ocrResult.isError) {
      await serviceClient.from('documents').update({
        status: 'error',
        error_message: ocrResult.errorMessage,
      }).eq('id', doc.id)

      return NextResponse.json({ error: ocrResult.errorMessage }, { status: 422 })
    }

    console.log(`[Process] OCR complete. Text length: ${ocrResult.text.length}`)

    // Step 2: AI Question Extraction
    const { questions, error: aiError } = await extractQuestions(ocrResult.text)

    if (aiError || questions.length === 0) {
      await serviceClient.from('documents').update({
        status: 'error',
        error_message: aiError || 'Tidak ada soal yang berhasil diekstrak.',
      }).eq('id', doc.id)

      return NextResponse.json({ error: aiError }, { status: 422 })
    }

    console.log(`[Process] Extracted ${questions.length} questions`)

    // Step 3: Save questions to DB
    const questionRows = questions.map((q, i) => ({
      document_id:    doc.id,
      user_id:        user.id,
      question_text:  q.question_text,
      options:        q.options,
      correct_answer: q.correct_answer,
      explanation:    q.explanation ?? null,
      order_index:    i,
    }))

    const { error: insertError } = await serviceClient
      .from('questions')
      .insert(questionRows)

    if (insertError) {
      await serviceClient.from('documents').update({
        status: 'error',
        error_message: `Gagal menyimpan soal: ${insertError.message}`,
      }).eq('id', doc.id)

      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Step 4: Mark document as completed
    await serviceClient.from('documents').update({
      status: 'completed',
      question_count: questions.length,
    }).eq('id', doc.id)

    return NextResponse.json({
      success: true,
      questionCount: questions.length,
    })
  } catch (err) {
    console.error('[Process] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi.' },
      { status: 500 }
    )
  }
}
