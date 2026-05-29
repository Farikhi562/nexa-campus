import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ocrFromUrl } from '@/lib/ocr'
import { extractQuestions, extractQuestionsFromPdf } from '@/lib/gemini'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.documentId) {
      return NextResponse.json({ error: 'documentId wajib diisi.' }, { status: 400 })
    }

    const { documentId } = body

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, file_path, status, title')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    // Allow reprocessing of errored docs too
    if (doc.status === 'completed') {
      return NextResponse.json({ error: 'Dokumen sudah selesai diproses.' }, { status: 409 })
    }

    if (!doc.file_path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Path dokumen tidak valid.' }, { status: 403 })
    }

    const serviceClient = createServiceClient()

    // Mark as processing
    await serviceClient
      .from('documents')
      .update({ status: 'processing', error_message: null })
      .eq('id', doc.id)

    const { data: fileData, error: downloadError } = await serviceClient
      .storage
      .from('documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      const errMsg = downloadError?.message || 'Gagal membaca file PDF dari storage.'
      await serviceClient.from('documents').update({
        status: 'error',
        error_message: errMsg,
      }).eq('id', doc.id)
      return NextResponse.json({ error: errMsg }, { status: 500 })
    }

    const pdfBytes = Buffer.from(await fileData.arrayBuffer())

    // Step 1: Gemini PDF vision/file extraction
    const pdfResult = await extractQuestionsFromPdf({
      bytes: pdfBytes,
      mimeType: fileData.type || 'application/pdf',
      title: doc.title,
    })

    let questions = pdfResult.questions
    let aiError = pdfResult.error
    let extractedText: string | null = null

    if (questions.length > 0) {
      console.log(`[Process] Gemini PDF extraction complete. Questions: ${questions.length}`)
    }

    // Fallback: OCR then Gemini text extraction
    if (questions.length === 0) {
      console.warn(`[Process] Gemini PDF extraction failed: ${aiError}. Falling back to OCR...`)

    // Get signed URL
    const { data: signedUrlData, error: signedUrlError } = await serviceClient
      .storage
      .from('documents')
      .createSignedUrl(doc.file_path, 120) // 2 min expiry for OCR

    if (signedUrlError || !signedUrlData?.signedUrl) {
      const errMsg = signedUrlError?.message || 'Gagal mengakses file. Coba upload ulang.'
      console.error('[Process] signedUrl error:', signedUrlError)

      await serviceClient.from('documents').update({
        status: 'error',
        error_message: errMsg,
      }).eq('id', doc.id)

      return NextResponse.json({ error: 'Gagal mendapatkan URL file.' }, { status: 500 })
    }

    // OCR — with retry
    console.log(`[Process] Starting OCR for doc ${documentId}`)
    let ocrResult = await ocrFromUrl(signedUrlData.signedUrl)

    if (ocrResult.isError) {
      // Retry once with fresh signed URL
      console.warn(`[Process] OCR failed first attempt: ${ocrResult.errorMessage}. Retrying...`)
      await new Promise((r) => setTimeout(r, 2000))

      const { data: retryUrlData } = await serviceClient
        .storage
        .from('documents')
        .createSignedUrl(doc.file_path, 120)

      if (retryUrlData?.signedUrl) {
        ocrResult = await ocrFromUrl(retryUrlData.signedUrl)
      }
    }

    if (ocrResult.isError) {
      const errorMessage = ocrResult.errorMessage || 'OCR gagal. Pastikan file PDF bisa dibaca dengan baik.'
      console.error('[Process] OCR error after retry:', errorMessage)

      await serviceClient.from('documents').update({
        status: 'error',
        error_message: `OCR gagal: ${errorMessage}`,
      }).eq('id', doc.id)

      return NextResponse.json({ error: errorMessage }, { status: 422 })
    }

    const ocrText = ocrResult.text?.trim()
    extractedText = ocrText || null
    if (!ocrText || ocrText.length < 50) {
      const errMsg = 'Teks dari dokumen terlalu pendek atau tidak terbaca. Coba PDF dengan teks yang lebih jelas.'
      await serviceClient.from('documents').update({
        status: 'error',
        error_message: errMsg,
      }).eq('id', doc.id)
      return NextResponse.json({ error: errMsg }, { status: 422 })
    }

    console.log(`[Process] OCR complete. Text length: ${ocrText.length}`)

      const textResult = await extractQuestions(ocrText)
      questions = textResult.questions
      aiError = textResult.error
    }

    if (aiError || !questions || questions.length === 0) {
      const errMsg = aiError || 'Tidak ada soal yang berhasil diekstrak dari materi ini.'
      console.error('[Process] AI extraction error:', errMsg)

      await serviceClient.from('documents').update({
        status: 'error',
        error_message: errMsg,
      }).eq('id', doc.id)

      return NextResponse.json({ error: errMsg }, { status: 422 })
    }

    console.log(`[Process] Extracted ${questions.length} questions`)

    // Step 3: Save questions
    const questionRows = questions.map((q, i) => ({
      document_id: doc.id,
      user_id: user.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
      order_index: i,
    }))

    // Delete existing questions if reprocessing
    await serviceClient.from('questions').delete().eq('document_id', doc.id)

    const { error: insertError } = await serviceClient
      .from('questions')
      .insert(questionRows)

    if (insertError) {
      console.error('[Process] Insert error:', insertError)
      await serviceClient.from('documents').update({
        status: 'error',
        error_message: `Gagal menyimpan soal: ${insertError.message}`,
      }).eq('id', doc.id)

      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Step 4: Mark completed
    await serviceClient.from('documents').update({
      status: 'completed',
      question_count: questions.length,
      extracted_text: extractedText,
      error_message: null,
    }).eq('id', doc.id)

    console.log(`[Process] Doc ${documentId} completed with ${questions.length} questions`)

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
