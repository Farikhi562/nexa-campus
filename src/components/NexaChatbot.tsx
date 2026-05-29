'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bot, Loader2, MessageCircle, Minus, Send, Sparkles, X } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'Apa bedanya Free, Basic, dan Pro?',
  'Gimana cara bayar via DOKU?',
  'Siapa yang bisa jual di marketplace?',
]

export default function NexaChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Halo, aku NEXA Assistant v1.0. Aku bisa bantu jelasin fitur, paket, DOKU checkout, marketplace, dan alur pakai NEXA.',
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const data = await response.json()
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content:
            data.reply ||
            data.error ||
            'Maaf, chatbot belum bisa menjawab. Pastikan GEMINI_API_KEY sudah aktif di server.',
        },
      ])
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content:
            'Koneksi ke chatbot sedang bermasalah. Kamu tetap bisa cek halaman FAQ, Pricing, atau Contact.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-5 sm:right-5">
      {open && (
        <div className="mb-3 flex h-[min(640px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 ring-4 ring-brand-400/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black">NEXA Assistant</p>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                    Online
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">Campus v1.0 support</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Minimize chatbot"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessages(messages.slice(0, 1))
                  setInput('')
                }}
                className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Reset chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
            <div className="mb-4 rounded-lg border border-brand-100 bg-white p-3 shadow-sm">
              <div className="flex gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />
                <p className="text-xs leading-5 text-brand-900">
                  Tanya seputar fitur NEXA, paket, DOKU, marketplace, reminder, atau kendala akun.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'rounded-br-sm bg-brand-600 text-white'
                        : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700 shadow-sm'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => sendMessage(starter)}
                  className="flex-shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-brand-300 hover:text-brand-700"
                >
                  {starter}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya NEXA..."
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Kirim pesan"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-400">
              <span>AI bisa salah, cek FAQ untuk info resmi.</span>
              <Link href="/faq" className="text-brand-700 hover:underline">
                FAQ v1.0
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex items-center gap-3 rounded-full bg-brand-600 p-2 pr-4 text-white shadow-2xl shadow-brand-300 transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200"
        aria-label={open ? 'Tutup chatbot NEXA' : 'Buka chatbot NEXA'}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <MessageCircle className="h-5 w-5" />
        </span>
        <span className="hidden text-sm font-black sm:inline">Tanya NEXA</span>
      </button>
    </div>
  )
}
