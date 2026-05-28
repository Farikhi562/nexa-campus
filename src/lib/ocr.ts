// ============================================================
// DIKTAT.AI — OCR.space Integration
// Docs: https://ocr.space/ocrapi
// Free tier: 500 pages/month (helloworld key)
// ============================================================
import 'server-only'

export interface OcrResult {
  text: string
  isError: boolean
  errorMessage?: string
}

/**
 * Extract text from a PDF buffer using OCR.space API.
 * Falls back to returning empty string on error (handled upstream).
 */
export async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<OcrResult> {
  const API_KEY = process.env.OCR_SPACE_API_KEY || 'helloworld'

  const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
  const formData = new FormData()
  formData.append('file', blob, 'document.pdf')
  formData.append('apikey', API_KEY)
  formData.append('language', 'ind')          // Indonesian
  formData.append('isOverlayRequired', 'false')
  formData.append('detectOrientation', 'true')
  formData.append('scale', 'true')
  formData.append('OCREngine', '2')           // Engine 2 = better for printed text

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      return {
        text: '',
        isError: true,
        errorMessage: `OCR API HTTP error: ${response.status}`,
      }
    }

    const data = await response.json()

    if (data.IsErroredOnProcessing) {
      return {
        text: '',
        isError: true,
        errorMessage: data.ErrorMessage?.join(', ') || 'OCR processing error',
      }
    }

    const text = data.ParsedResults
      ?.map((r: { ParsedText: string }) => r.ParsedText)
      .join('\n\n') || ''

    if (!text.trim()) {
      return {
        text: '',
        isError: true,
        errorMessage: 'Dokumen tidak dapat dibaca. Pastikan PDF mengandung teks yang jelas.',
      }
    }

    return { text: text.trim(), isError: false }
  } catch (err) {
    return {
      text: '',
      isError: true,
      errorMessage: `Network error: ${err instanceof Error ? err.message : 'Unknown'}`,
    }
  }
}

/**
 * Fetch PDF from Supabase signed URL and run OCR on it.
 */
export async function ocrFromUrl(signedUrl: string): Promise<OcrResult> {
  try {
    const res = await fetch(signedUrl)
    if (!res.ok) {
      return { text: '', isError: true, errorMessage: 'Failed to download PDF from storage' }
    }
    const buffer = await res.arrayBuffer()
    return extractTextFromPdf(buffer)
  } catch (err) {
    return {
      text: '',
      isError: true,
      errorMessage: `Download error: ${err instanceof Error ? err.message : 'Unknown'}`,
    }
  }
}
