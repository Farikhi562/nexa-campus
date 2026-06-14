import 'server-only'

/**
 * Unified LLM layer untuk NEXA Campus.
 *
 * Tujuan: gampang ganti penyedia AI tanpa ubah kode. Cukup set ENV.
 * Semua penyedia di bawah punya tier GRATIS.
 *
 * Cara pilih (set di Vercel / .env):
 *   AI_PROVIDER = groq        (default, gratis & cepat)
 *   AI_API_KEY  = <api key sesuai provider>
 *
 * Opsional override model:
 *   AI_TEXT_MODEL   = ...
 *   AI_VISION_MODEL = ...
 *
 * Lihat docs/AI_PROVIDER_GUIDE.md untuk perbandingan & cara dapat API key gratis.
 */

export type AiProvider = 'groq' | 'openrouter' | 'cerebras' | 'gemini'

type ProviderConfig = {
  label: string
  baseUrl: string // OpenAI-compatible base (kosong untuk gemini)
  textModel: string
  visionModel: string | null
  supportsVision: boolean
  free: boolean
  keyEnv: string // nama env key spesifik provider
  getKeyUrl: string
}

export const AI_PROVIDERS: Record<AiProvider, ProviderConfig> = {
  groq: {
    label: 'Groq — gratis, sangat cepat (rekomendasi)',
    baseUrl: 'https://api.groq.com/openai/v1',
    textModel: 'llama-3.3-70b-versatile',
    visionModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    supportsVision: true,
    free: true,
    keyEnv: 'GROQ_API_KEY',
    getKeyUrl: 'https://console.groq.com/keys',
  },
  openrouter: {
    label: 'OpenRouter — banyak model gratis (akhiran :free)',
    baseUrl: 'https://openrouter.ai/api/v1',
    textModel: 'meta-llama/llama-3.3-70b-instruct:free',
    visionModel: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    supportsVision: true,
    free: true,
    keyEnv: 'OPENROUTER_API_KEY',
    getKeyUrl: 'https://openrouter.ai/keys',
  },
  cerebras: {
    label: 'Cerebras — gratis & tercepat (teks saja, tanpa baca foto)',
    baseUrl: 'https://api.cerebras.ai/v1',
    textModel: 'llama-3.3-70b',
    visionModel: null,
    supportsVision: false,
    free: true,
    keyEnv: 'CEREBRAS_API_KEY',
    getKeyUrl: 'https://cloud.cerebras.ai',
  },
  gemini: {
    label: 'Google Gemini — free tier (butuh kuota tersedia)',
    baseUrl: '',
    textModel: 'gemini-2.5-flash-lite',
    visionModel: 'gemini-2.5-flash',
    supportsVision: true,
    free: true,
    keyEnv: 'GEMINI_API_KEY',
    getKeyUrl: 'https://aistudio.google.com/apikey',
  },
}

function resolveProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER || '').trim().toLowerCase()
  if (raw === 'groq' || raw === 'openrouter' || raw === 'cerebras' || raw === 'gemini') {
    return raw
  }
  // Default: groq kalau ada GROQ_API_KEY, kalau tidak pakai gemini (kompat lama).
  if (process.env.GROQ_API_KEY || process.env.AI_API_KEY) return 'groq'
  if (process.env.GEMINI_API_KEY) return 'gemini'
  return 'groq'
}

function resolveApiKey(provider: AiProvider): string | undefined {
  // Generic AI_API_KEY menang, lalu key spesifik provider.
  const cfg = AI_PROVIDERS[provider]
  return (process.env.AI_API_KEY || process.env[cfg.keyEnv] || '').trim() || undefined
}

function resolveTextModel(provider: AiProvider): string {
  return (process.env.AI_TEXT_MODEL || '').trim() || AI_PROVIDERS[provider].textModel
}

function resolveVisionModel(provider: AiProvider): string | null {
  const override = (process.env.AI_VISION_MODEL || '').trim()
  if (override) return override
  return AI_PROVIDERS[provider].visionModel
}

export function activeProvider(): AiProvider {
  return resolveProvider()
}

export function aiConfigured(): boolean {
  const provider = resolveProvider()
  return Boolean(resolveApiKey(provider))
}

export function activeProviderInfo() {
  const provider = resolveProvider()
  const cfg = AI_PROVIDERS[provider]
  return {
    provider,
    label: cfg.label,
    textModel: resolveTextModel(provider),
    visionModel: resolveVisionModel(provider),
    supportsVision: cfg.supportsVision && Boolean(resolveVisionModel(provider)),
    configured: Boolean(resolveApiKey(provider)),
    free: cfg.free,
  }
}

type GenTextInput = {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
  /** minta output JSON kalau provider mendukung response_format */
  json?: boolean
}

type GenImageInput = {
  system: string
  prompt: string
  base64: string
  mimeType: string
  temperature?: number
  maxTokens?: number
  json?: boolean
}

export type LlmError = {
  code: 'not_configured' | 'http_error' | 'empty' | 'no_vision'
  status?: number
  message: string
}

export class LlmFailure extends Error {
  info: LlmError
  constructor(info: LlmError) {
    super(info.message)
    this.info = info
  }
}

// ---------- OpenAI-compatible (Groq / OpenRouter / Cerebras) ----------

async function openAiChat(
  provider: AiProvider,
  apiKey: string,
  model: string,
  messages: unknown[],
  temperature: number,
  maxTokens: number,
  json: boolean
): Promise<string> {
  const cfg = AI_PROVIDERS[provider]
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  // OpenRouter menyarankan header identitas (opsional tapi baik).
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://campus.nexatechlabs.my.id'
    headers['X-Title'] = 'NEXA Campus'
  }

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  }
  // Sebagian model gratis menolak response_format; hanya kirim kalau diminta JSON.
  if (json) {
    payload.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[AI:${provider}] HTTP ${res.status} ${model}`, detail.slice(0, 500))
    // Retry tanpa response_format kalau itu sumber error.
    if (json && (res.status === 400 || res.status === 422)) {
      return openAiChat(provider, apiKey, model, messages, temperature, maxTokens, false)
    }
    throw new LlmFailure({ code: 'http_error', status: res.status, message: `AI provider error (HTTP ${res.status}).` })
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content?.trim() || ''
  if (!text) throw new LlmFailure({ code: 'empty', message: 'AI tidak mengembalikan jawaban.' })
  return text
}

// ---------- Gemini REST ----------

async function geminiGenerate(
  apiKey: string,
  model: string,
  system: string,
  parts: unknown[],
  temperature: number,
  maxTokens: number,
  json: boolean
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    }
  )

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[AI:gemini] HTTP ${res.status} ${model}`, detail.slice(0, 500))
    throw new LlmFailure({ code: 'http_error', status: res.status, message: `Gemini error (HTTP ${res.status}).` })
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n').trim() || ''
  if (!text) throw new LlmFailure({ code: 'empty', message: 'Gemini tidak mengembalikan jawaban.' })
  return text
}

// ---------- Public API ----------

export async function generateText(input: GenTextInput): Promise<{ text: string; provider: AiProvider; model: string }> {
  const provider = resolveProvider()
  const apiKey = resolveApiKey(provider)
  const model = resolveTextModel(provider)
  const temperature = input.temperature ?? 0.3
  const maxTokens = input.maxTokens ?? 800
  const json = input.json ?? false

  if (!apiKey) {
    throw new LlmFailure({ code: 'not_configured', message: 'AI belum dikonfigurasi (API key kosong).' })
  }

  if (provider === 'gemini') {
    const text = await geminiGenerate(apiKey, model, input.system, [{ text: input.user }], temperature, maxTokens, json)
    return { text, provider, model }
  }

  const messages = [
    { role: 'system', content: input.system },
    { role: 'user', content: input.user },
  ]
  const text = await openAiChat(provider, apiKey, model, messages, temperature, maxTokens, json)
  return { text, provider, model }
}

export async function generateFromImage(
  input: GenImageInput
): Promise<{ text: string; provider: AiProvider; model: string }> {
  const provider = resolveProvider()
  const apiKey = resolveApiKey(provider)
  const model = resolveVisionModel(provider)
  const temperature = input.temperature ?? 0.1
  const maxTokens = input.maxTokens ?? 1200
  const json = input.json ?? true

  if (!apiKey) {
    throw new LlmFailure({ code: 'not_configured', message: 'AI belum dikonfigurasi (API key kosong).' })
  }
  if (!model) {
    throw new LlmFailure({
      code: 'no_vision',
      message: `Provider "${provider}" belum mendukung baca foto. Pakai Groq/OpenRouter/Gemini untuk fitur foto.`,
    })
  }

  if (provider === 'gemini') {
    const parts = [
      { text: input.prompt },
      { inline_data: { mime_type: input.mimeType, data: input.base64 } },
    ]
    const text = await geminiGenerate(apiKey, model, input.system, parts, temperature, maxTokens, json)
    return { text, provider, model }
  }

  const dataUri = `data:${input.mimeType};base64,${input.base64}`
  const messages = [
    { role: 'system', content: input.system },
    {
      role: 'user',
      content: [
        { type: 'text', text: input.prompt },
        { type: 'image_url', image_url: { url: dataUri } },
      ],
    },
  ]
  const text = await openAiChat(provider, apiKey, model, messages, temperature, maxTokens, json)
  return { text, provider, model }
}
