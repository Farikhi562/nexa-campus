'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FirstTimeOnboardingProps = {
  userId: string
  userName?: string | null
}

type ReminderPreference = 'telegram' | 'dashboard'

const deadlineSources = ['VClass', 'iLab', 'Grup WA', 'Email Dosen', 'BAAK', 'Lainnya']
const categories = ['UTS', 'UAS', 'Tugas', 'Quiz', 'Praktikum', 'Lainnya']
const priorities = ['low', 'medium', 'high'] as const

export default function FirstTimeOnboarding({ userId, userName }: FirstTimeOnboardingProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState(1)
  const [sources, setSources] = useState<string[]>([])
  const [reminderPreference, setReminderPreference] = useState<ReminderPreference>('dashboard')
  const [telegramUsername, setTelegramUsername] = useState('')
  const [deadlineTitle, setDeadlineTitle] = useState('')
  const [deadlineCategory, setDeadlineCategory] = useState('Tugas')
  const [deadlineDueDate, setDeadlineDueDate] = useState('')
  const [deadlinePriority, setDeadlinePriority] = useState<(typeof priorities)[number]>('medium')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const displayName = userName?.trim() || 'teman NEXA'
  const canContinueStep1 = sources.length > 0
  const canContinueStep2 = reminderPreference === 'dashboard' || telegramUsername.trim().length > 0
  const canSaveDeadline = deadlineTitle.trim().length > 0 && deadlineDueDate.length > 0

  const toggleSource = (source: string) => {
    setSources((current) => current.includes(source) ? current.filter((item) => item !== source) : [...current, source])
  }

  const saveMetadata = async () => {
    setError('')
    setIsSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        deadline_sources: sources,
        reminder_preference: reminderPreference,
        telegram_username: reminderPreference === 'telegram' ? normalizeTelegramUsername(telegramUsername) : null,
      },
    })
    setIsSaving(false)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    return true
  }

  const goToStep2 = async () => {
    if (!canContinueStep1) {
      setError('Pilih minimal satu sumber deadline.')
      return
    }

    const saved = await saveMetadata()
    if (saved) setStep(2)
  }

  const goToStep3 = async () => {
    if (!canContinueStep2) {
      setError('Isi username Telegram atau pilih cukup dashboard dulu.')
      return
    }

    const saved = await saveMetadata()
    if (saved) setStep(3)
  }

  const completeOnboarding = async (skipDeadline = false) => {
    if (!skipDeadline && !canSaveDeadline) {
      setError('Isi judul dan tanggal deadline dulu, atau skip untuk sekarang.')
      return
    }

    setError('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          deadlineSources: sources,
          reminderPreference,
          telegramUsername: reminderPreference === 'telegram' ? normalizeTelegramUsername(telegramUsername) : null,
          deadline: skipDeadline ? null : {
            title: deadlineTitle.trim(),
            category: deadlineCategory,
            due_date: deadlineDueDate,
            priority: deadlinePriority,
          },
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyelesaikan onboarding.')
      }

      router.replace('/dashboard?onboarding=success')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyelesaikan onboarding.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-black uppercase tracking-wide text-brand-700">Step {step} of 3</p>
            <div className="flex gap-1.5" aria-hidden="true">
              {[1, 2, 3].map((item) => (
                <span key={item} className={`h-2 w-10 rounded-full ${item <= step ? 'bg-brand-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {step === 1 && (
            <section>
              <h2 className="text-2xl font-black text-slate-950">Halo {displayName}! Deadline kamu dari mana?</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {deadlineSources.map((source) => (
                  <label key={source} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 hover:border-brand-300 hover:bg-brand-50">
                    <input
                      type="checkbox"
                      checked={sources.includes(source)}
                      onChange={() => toggleSource(source)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {source}
                  </label>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="text-2xl font-black text-slate-950">Mau diingetin lewat mana?</h2>
              <div className="mt-6 space-y-3">
                <label className="block rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="reminder"
                      checked={reminderPreference === 'telegram'}
                      onChange={() => setReminderPreference('telegram')}
                      className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-black text-slate-950">Telegram</span>
                  </div>
                  {reminderPreference === 'telegram' && (
                    <input
                      value={telegramUsername}
                      onChange={(event) => setTelegramUsername(event.target.value)}
                      placeholder="@username"
                      className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  )}
                </label>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 opacity-70">
                  <div className="flex items-center gap-3">
                    <input type="radio" disabled className="h-4 w-4 border-slate-300" />
                    <span className="font-black text-slate-950">WhatsApp</span>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800">coming soon</span>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50">
                  <input
                    type="radio"
                    name="reminder"
                    checked={reminderPreference === 'dashboard'}
                    onChange={() => setReminderPreference('dashboard')}
                    className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-black text-slate-950">Cukup dashboard dulu</span>
                </label>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-brand-600" />
                <h2 className="text-2xl font-black text-slate-950">Tambah deadline pertamamu</h2>
              </div>
              <div className="mt-6 grid gap-4">
                <input
                  value={deadlineTitle}
                  onChange={(event) => setDeadlineTitle(event.target.value)}
                  placeholder="Contoh: Kumpul laporan praktikum"
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <select value={deadlineCategory} onChange={(event) => setDeadlineCategory(event.target.value)} className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500">
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <input type="date" value={deadlineDueDate} onChange={(event) => setDeadlineDueDate(event.target.value)} className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500" />
                  <select value={deadlinePriority} onChange={(event) => setDeadlinePriority(event.target.value as (typeof priorities)[number])} className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
          {step === 3 && (
            <button
              type="button"
              onClick={() => completeOnboarding(true)}
              disabled={isSaving}
              className="rounded-lg px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              Skip untuk sekarang
            </button>
          )}

          <button
            type="button"
            onClick={step === 1 ? goToStep2 : step === 2 ? goToStep3 : () => completeOnboarding(false)}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 3 ? <Check className="h-4 w-4" /> : null}
            {step === 3 ? 'Selesai' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  )
}

function normalizeTelegramUsername(value: string) {
  const trimmed = value.trim()
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}
