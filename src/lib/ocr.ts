// ============================================================
// NEXA Campus Ecosystem — OCR.space Integration
// Docs: https://ocr.space/ocrapi
// Free tier: 500 pages/month (helloworld key)
// ============================================================
import 'server-only'

export interface OcrResult {
  text: string
  isError: boolean
  errorMessage?: string
}

const OCR_API_URL = 'https://api.ocr.space/parse/image'
const OCR_TIMEOUT_MS = 55_000

function normalizeOcrError(value: unknown): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  if (typeof value === 'string') return value
  return undefined
}

/**
 * Extract text from a PDF buffer using OCR.space API.
 * Falls back to returning empty string on error (handled upstream).
 */
export async function extractTextFromPdf(
  pdfBuffer: ArrayBuffer,
  filename = 'document.pdf'
): Promise<OcrResult> {
  const API_KEY = process.env.OCR_SPACE_API_KEY || 'helloworld'
  const language = process.env.OCR_SPACE_LANGUAGE || 'auto'

  const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
  const formData = new FormData()
  formData.append('file', blob, filename)
  formData.append('apikey', API_KEY)
  formData.append('language', language)
  formData.append('filetype', 'PDF')
  formData.append('isOverlayRequired', 'false')
  formData.append('detectOrientation', 'true')
  formData.append('scale', 'true')
  formData.append('OCREngine', '2')

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS)

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const raw = await response.text()
    let data: {
      IsErroredOnProcessing?: boolean
      ParsedResults?: Array<{ ParsedText?: string }>
      ErrorMessage?: unknown
      ErrorDetails?: unknown
    } = {}

    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }

    const apiError =
      normalizeOcrError(data.ErrorMessage) ||
      normalizeOcrError(data.ErrorDetails)

    if (!response.ok) {
      return {
        text: '',
        isError: true,
        errorMessage: `OCR.space menolak request (HTTP ${response.status})${apiError ? `: ${apiError}` : ''}`,
      }
    }

    if (data.IsErroredOnProcessing) {
      return {
        text: '',
        isError: true,
        errorMessage: apiError || 'OCR.space gagal memproses Dokumen.',
      }
    }

    const text = data.ParsedResults
      ?.map((r) => r.ParsedText ?? '')
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
      errorMessage: `Network/timeout error saat OCR: ${err instanceof Error ? err.message : 'Unknown'}`,
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
