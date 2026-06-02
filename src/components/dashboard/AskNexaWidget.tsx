'use client'

import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

type AskNexaResponse = {
  answer?: string
  provider?: 'gemini' | 'static'
  error?: string
}

export default function AskNexaWidget() {
  const [message, setMessage] = useState('')
  const [answer, setAnswer] = useState('')
  const [provider, setProvider] = useState<'gemini' | 'static' | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = message.trim()

    if (!trimmed) {
      setError('Tulis pertanyaan dulu ya.')
      return
    }

    if (trimmed.length > 1000) {
      setError('Pertanyaannya kepanjangan. Coba ringkas maksimal 1000 karakter.')
      return
    }

    setLoading(true)
    setError('')
    setAnswer('')
    setProvider(null)

    const response = await fetch('/api/ask-nexa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: trimmed }),
    })

    const data = (await response.json().catch(() => null)) as AskNexaResponse | null
    setLoading(false)

    if (!response.ok || !data) {
      setError(data?.error || 'Tanya NEXA lagi penuh sebentar. Coba lagi nanti.')
      return
    }

    if (data.error) {
      setError(data.error)
      return
    }

    setAnswer(data.answer ?? '')
    setProvider(data.provider ?? null)
  }

  return (
    <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-950">Tanya NEXA</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Bingung deadline, reminder, atau cara pakai NEXA? Tanya aja.
            </p>
          </div>
          {provider && (
            <Badge tone={provider === 'gemini' ? 'brand' : 'warning'}>
              {provider === 'gemini' ? 'Gemini' : 'FAQ'}
            </Badge>
          )}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Contoh: gimana cara nambah deadline praktikum?"
            className="focus-ring w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              {loading
                ? 'NEXA lagi mikir sebentar...'
                : 'Tanya hal ringan dulu. Jangan langsung nanya makna hidup, kita mulai dari deadline.'}
            </p>
            <Button type="submit" disabled={loading} className="rounded-2xl">
              {loading ? 'Mikir...' : 'Tanya'}
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        {answer && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            {answer}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
