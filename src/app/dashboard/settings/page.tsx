'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BellRing,
  CheckCircle2,
  CreditCard,
  FileText,
  Mail,
  MessageCircle,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { PlanBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS, type Plan, type Profile } from '@/types'

type Preferences = {
  emailSummary: boolean
  deadlineReminder: boolean
  campusUpdates: boolean
  telegramReminder: boolean
}

const DEFAULT_PREFERENCES: Preferences = {
  emailSummary: true,
  deadlineReminder: true,
  campusUpdates: false,
  telegramReminder: false,
}

const STORAGE_KEY = 'nexa-settings-preferences'
const SUPPORT_EMAIL = 'nexatechlabs271@gmail.com'
const SUPPORT_WHATSAPP = '6285697916845'

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTelegram, setSavingTelegram] = useState(false)
  const [saved, setSaved] = useState(false)
  const [telegramSaved, setTelegramSaved] = useState(false)
  const [telegramChatId, setTelegramChatId] = useState('')
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data as Profile)
          setTelegramChatId(data.telegram_chat_id || '')
        }
      }

      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) })
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  function updatePreference(key: keyof Preferences) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }))
  }

  function savePreferences() {
    setSaving(true)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }, 350)
  }

  async function saveTelegramChatId() {
    setSavingTelegram(true)
    setTelegramSaved(false)

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_chat_id: telegramChatId.trim() || null }),
    })

    if (response.ok) {
      const updated = await response.json()
      setProfile(updated as Profile)
      setTelegramSaved(true)
      setTimeout(() => setTelegramSaved(false), 2500)
    }

    setSavingTelegram(false)
  }

  function supportEmailLink(topic: 'delete-account' | 'refund') {
    const subject = topic === 'delete-account' ? 'Hapus Akun NEXA' : 'Refund Paket NEXA'
    const body = [
      `Halo admin NEXA, saya ingin mengajukan ${topic === 'delete-account' ? 'penghapusan akun' : 'refund paket'}.`,
      `Email akun: ${profile?.email || ''}`,
      `Nama: ${profile?.full_name || ''}`,
      'Alasan:',
    ].join('\n')

    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  function supportWhatsappLink(topic: 'delete-account' | 'refund') {
    const text = encodeURIComponent(
      [
        `Halo admin NEXA, saya ingin mengajukan ${topic === 'delete-account' ? 'penghapusan akun' : 'refund paket'}.`,
        `Email akun: ${profile?.email || ''}`,
        `Nama: ${profile?.full_name || ''}`,
        'Mohon dibantu verifikasi.',
      ].join('\n')
    )

    return `https://t.me/${SUPPORT_WHATSAPP}?text=${text}`
  }

  const plan = (profile?.plan ?? 'free') as Plan
  const isPaid = plan !== 'free'
  const limits = PLAN_LIMITS[plan]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <Settings className="h-3.5 w-3.5" />
              Pengaturan
            </div>
            <h1 className="text-3xl font-black text-slate-950">Atur akun dan pengalaman NEXA.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Kelola profil, paket, notifikasi, dan preferensi penggunaan Campus Tools.
            </p>
          </div>
          <PlanBadge plan={plan} className="w-fit" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <Panel title="Akun" icon={UserRound}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg font-black text-brand-700">
                {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-950">{profile?.full_name || 'Lengkapi profil'}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{profile?.email || '-'}</span>
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {profile?.universitas || 'Universitas belum diisi'}{profile?.jurusan ? `, ${profile.jurusan}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/profile">
                <Button type="button" variant="secondary">Edit Profil</Button>
              </Link>
              <Link href="/pricing">
                <Button type="button" variant="outline">
                  <CreditCard className="h-4 w-4" />
                  Kelola Paket
                </Button>
              </Link>
            </div>
          </Panel>

          <Panel title="Preferensi Notifikasi" icon={BellRing}>
            <div className="space-y-3">
              <Toggle
                title="Ringkasan belajar via email"
                desc="Kirim rekap aktivitas dan rekomendasi belajar mingguan."
                checked={preferences.emailSummary}
                onChange={() => updatePreference('emailSummary')}
              />
              <Toggle
                title="Reminder deadline"
                desc="Aktifkan pengingat tugas, ujian, dan praktikum yang sudah dijadwalkan."
                checked={preferences.deadlineReminder}
                onChange={() => updatePreference('deadlineReminder')}
              />
              <Toggle
                title="Update kampus dan event"
                desc="Tampilkan info seminar, lomba, dan peluang kampus yang relevan."
                checked={preferences.campusUpdates}
                onChange={() => updatePreference('campusUpdates')}
              />
              <Toggle
                title="Telegram reminder"
                desc={isPaid ? 'Reminder Telegram aktif via @NEXATchBot.' : 'Upgrade paket untuk memakai reminder Telegram otomatis.'}
                checked={preferences.telegramReminder && isPaid}
                disabled={!isPaid}
                onChange={() => updatePreference('telegramReminder')}
              />
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button type="button" loading={saving} onClick={savePreferences}>
                <Save className="h-4 w-4" />
                Simpan Pengaturan
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Tersimpan
                </span>
              )}
            </div>
          </Panel>

          <Panel title="Hubungkan Telegram" icon={MessageCircle}>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-black text-sky-950">Bot reminder: @NEXATchBot</p>
              <p className="mt-1 text-xs leading-5 text-sky-800">
                Buka https://t.me/NEXATchBot, chat /start, lalu masukkan chat_id kamu di sini agar reminder ujian dikirim lewat Telegram.
              </p>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">Telegram chat_id</span>
              <input
                value={telegramChatId}
                onChange={(event) => setTelegramChatId(event.target.value)}
                placeholder="Contoh: 123456789"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <div className="mt-4 flex items-center gap-3">
              <Button type="button" loading={savingTelegram} onClick={saveTelegramChatId}>
                <Save className="h-4 w-4" />
                Simpan Telegram
              </Button>
              {telegramSaved && (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Terhubung
                </span>
              )}
            </div>
          </Panel>

          <Panel title="Data & Akun" icon={Trash2}>
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
                  <div>
                    <p className="text-sm font-black text-slate-950">Hapus dokumen</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Dokumen bisa dihapus dari dashboard materi. Penghapusan dokumen dapat ikut menghapus soal dan sesi ujian yang terkait.
                    </p>
                    <Link href="/dashboard" className="mt-3 inline-flex">
                      <Button type="button" variant="outline" size="sm">Buka Materi</Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />
                  <div>
                    <p className="text-sm font-black text-red-950">Request hapus akun</p>
                    <p className="mt-1 text-xs leading-5 text-red-800">
                      Penghapusan akun diproses lewat support resmi agar kepemilikan akun bisa diverifikasi. Data profil, dokumen, soal, sesi ujian, dan listing terkait dapat ikut dihapus.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={supportEmailLink('delete-account')}>
                        <Button type="button" variant="danger" size="sm">Email Hapus Akun</Button>
                      </a>
                      <a href={supportWhatsappLink('delete-account')} target="_blank" rel="noreferrer">
                        <Button type="button" variant="outline" size="sm">Telegram Support</Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Akses Paket" icon={ShieldCheck}>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Paket aktif</p>
              <p className="mt-2 text-2xl font-black capitalize text-slate-950">{plan}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isPaid
                  ? 'Akun berbayar bisa memakai semua Campus Tools dan fitur produktivitas utama.'
                  : 'Akun gratis bisa mencoba fitur inti dengan limit. Upgrade untuk membuka semua tools.'}
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ['Campus Tools', isPaid ? 'Semua terbuka' : 'Gratis terbatas'],
                ['Mock Exam', isPaid ? 'Tak terbatas' : '1 sesi'],
                ['Marketplace seller', isPaid ? 'Aktif' : 'Terkunci'],
                ['Study Room', limits.canStudyRoom ? 'Aktif' : 'Basic+'],
                ['Team Seat', plan === 'pro' || plan === 'admin' ? '3 seat' : 'Pro only'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <span className="text-xs font-bold text-slate-500">{value}</span>
                </div>
              ))}
            </div>
            <Link href="/pengaturan/tim-seat" className="mt-4 inline-flex">
              <Button type="button" variant="outline" size="sm">Kelola Team Seat</Button>
            </Link>
          </Panel>

          <Panel title="Bantuan" icon={MessageCircle}>
            <p className="text-sm leading-6 text-slate-600">
              Butuh aktivasi paket, reset akun, refund, atau bantuan integrasi kampus? Hubungi support resmi NEXA untuk request link DOKU dan verifikasi akun.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/contact" className="inline-flex">
                <Button type="button" variant="secondary">
                  <MessageCircle className="h-4 w-4" />
                  Kontak Support
                </Button>
              </Link>
              <a href={supportEmailLink('refund')}>
                <Button type="button" variant="outline">Ajukan Refund</Button>
              </a>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Settings; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950">
        <Icon className="h-5 w-5 text-brand-600" />
        {title}
      </h2>
      {children}
    </section>
  )
}

function Toggle({
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  title: string
  desc: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 text-left transition hover:border-brand-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
    >
      <span>
        <span className="block text-sm font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{desc}</span>
      </span>
      <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  )
}
