'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BellRing,
  CheckCircle2,
  CreditCard,
  Mail,
  MessageCircle,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { PlanBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Plan, Profile } from '@/types'

type Preferences = {
  emailSummary: boolean
  deadlineReminder: boolean
  campusUpdates: boolean
  whatsappReminder: boolean
}

const DEFAULT_PREFERENCES: Preferences = {
  emailSummary: true,
  deadlineReminder: true,
  campusUpdates: false,
  whatsappReminder: false,
}

const STORAGE_KEY = 'nexa-settings-preferences'

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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

        if (data) setProfile(data as Profile)
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

  const plan = (profile?.plan ?? 'free') as Plan
  const isPaid = plan !== 'free'

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
                title="WhatsApp reminder"
                desc={isPaid ? 'Reminder WhatsApp aktif untuk paket berbayar.' : 'Upgrade paket untuk memakai reminder WhatsApp.'}
                checked={preferences.whatsappReminder && isPaid}
                disabled={!isPaid}
                onChange={() => updatePreference('whatsappReminder')}
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
                ['Study Room', plan === 'pro' ? 'Aktif' : 'Pro only'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <span className="text-xs font-bold text-slate-500">{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Bantuan" icon={MessageCircle}>
            <p className="text-sm leading-6 text-slate-600">
              Butuh aktivasi paket, reset akun, atau bantuan integrasi kampus? Hubungi admin dari halaman pricing agar pesan upgrade otomatis membawa detail akunmu dan request link Midtrans.
            </p>
            <Link href="/pricing" className="mt-4 inline-flex">
              <Button type="button" variant="secondary">
                <MessageCircle className="h-4 w-4" />
                Hubungi Admin
              </Button>
            </Link>
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
