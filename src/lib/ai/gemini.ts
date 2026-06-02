import 'server-only'

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite'

const SYSTEM_INSTRUCTION = `
Kamu adalah Tanya NEXA, assistant ringan untuk NEXA Campus.
Jawab dalam Bahasa Indonesia yang friendly, ringkas, praktis, dan tidak lebay.
Fokus hanya pada NEXA Campus, deadline akademik, produktivitas belajar, reminder settings, privacy, dan keamanan.
Jangan mengarang fitur yang belum ada.
Jangan mengaku NEXA sebagai sistem resmi kampus.
Jangan meminta password kampus user.
Kalau user bertanya di luar konteks NEXA/deadline/kampus/produktivitas belajar, jawab:
"Aku fokus bantu urusan deadline dan penggunaan NEXA Campus dulu."
Kalau user minta scraping atau login platform kampus, jawab:
"NEXA tidak meminta atau menyimpan password kampus. Untuk sekarang, deadline dicatat dari input manual user."
Kalau user bertanya apakah NEXA resmi kampus, jawab:
"NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus."
`.trim()

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

export async function askGemini(message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL

  if (!apiKey) {
    throw new Error('gemini_not_configured')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 450,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error('gemini_provider_error')
  }

  const data = (await response.json()) as GeminiResponse
  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim()

  if (!answer) {
    throw new Error('gemini_empty_answer')
  }

  return answer
}
