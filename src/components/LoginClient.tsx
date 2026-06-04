'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import NexaCampusLogo from '@/components/brand/NexaCampusLogo'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginClient({ initialMode = 'login' }: { initialMode?: Mode }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const urlError = new URLSearchParams(window.location.search).get('error')
    if (urlError) {
      setError(getSafeAuthError(urlError))
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/dashboard')
      }
    })
  }, [router, supabase])

  function getSafeAuthError(value: string) {
    if (value === 'missing_code') return 'Kode login tidak ditemukan. Coba login ulang.'
    if (value === 'auth_callback_failed') return 'Login gagal diproses. Coba lagi sebentar.'
    if (value === 'reset_success') return 'Password berhasil diubah. Kamu bisa lanjut masuk lagi.'
    return 'Ada masalah saat autentikasi. Coba lagi sebentar.'
  }

  async function signInWithGoogle() {
    setLoading(true)
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (oauthError) {
      setError('Google login gagal dimulai. Coba lagi sebentar.')
      setLoading(false)
    }
  }

  async function sendResetLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })

    setLoading(false)
    if (resetError) {
      setError('Link reset gagal dikirim. Coba cek email dan ulangi sebentar lagi.')
      return
    }
    setMessage('Link reset dikirim kalau email ini terdaftar. Cek inbox atau spam ya.')
  }

  return (
    <main className="auth-page">
      <div className="pointer-events-none absolute inset-0">
        <div className="auth-ambient absolute inset-0" />
        <div className="auth-grid-pattern absolute inset-0 opacity-[0.08]" />
        <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full border border-teal-300/10" />
        <div className="absolute left-[-3rem] top-[-3rem] h-56 w-56 rounded-full border border-cyan-200/10" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:px-8 lg:py-8">
        <section className="auth-shell-panel auth-fade-up-delayed order-2 flex flex-col justify-between p-5 sm:p-8 lg:order-1">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <NexaCampusLogo tone="dark" imageClassName="h-12 w-12" />
            </Link>
            <div className="hidden rounded-full border border-teal-200/15 bg-teal-200/10 px-3 py-1.5 text-xs font-bold text-teal-100 sm:inline-flex">
              Beta access
            </div>
          </div>

          <div className="py-10 lg:py-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-100/10 px-3 py-1.5 text-xs font-bold text-teal-100 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy-first. No campus password.
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Deadline kampus, akhirnya kelihatan jelas.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              NEXA bantu kamu mencatat, melihat, dan mengingat deadline tugas/praktikum tanpa minta password kampus.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: CalendarCheck2, title: 'Dashboard cepat', desc: 'Hari ini, minggu ini, terlambat.' },
                { icon: BellRing, title: 'Reminder-ready', desc: 'Telegram dulu, Wablas nanti.' },
                { icon: LockKeyhole, title: 'Data minimum', desc: 'Profil dan deadline input sendiri.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
                  <Icon className="mb-4 h-5 w-5 text-teal-200" />
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
              NEXA tidak meminta password VClass, iLab, Studentsite, atau platform kampus mana pun. Data yang disimpan hanya profil dan deadline yang kamu input sendiri.
            </div>
            <div className="auth-radar-tile">
              <Radar className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-teal-200/70" />
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200 shadow-[0_0_22px_rgba(94,234,212,0.9)]" />
            </div>
          </div>
        </section>

        <section className="order-1 flex items-center justify-center lg:order-2">
          <div className="w-full max-w-[460px]">
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <NexaCampusLogo tone="dark" imageClassName="h-11 w-11" />
              </Link>
            </div>

            <div className="auth-card-frame auth-fade-up">
              <div className="auth-card-inner p-5 sm:p-6">
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">
                      <Sparkles className="h-3.5 w-3.5 text-teal-200" />
                      Akun beta
                    </div>
                    <span className="rounded-full bg-teal-300/10 px-3 py-1.5 text-xs font-bold text-teal-100">
                      Google OAuth
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {mode === 'forgot' ? 'Pulihkan akses NEXA' : mode === 'signup' ? 'Daftar akun NEXA' : 'Masuk ke NEXA'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {mode === 'forgot'
                      ? 'Masukkan email akunmu. Link reset dikirim kalau email ini terdaftar.'
                      : 'Pakai Google OAuth. Praktis, aman, dan tidak menyentuh password kampus.'}
                  </p>
                </div>

                {mode !== 'forgot' && (
                  <div className="mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1 text-sm font-bold">
                    {[
                      ['login', 'Login'],
                      ['signup', 'Daftar'],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => {
                          setMode(id as Mode)
                          setError('')
                          setMessage('')
                        }}
                        className={`rounded-xl px-3 py-2.5 transition ${
                          mode === id
                            ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'forgot' ? (
                  <form onSubmit={sendResetLink} className="space-y-4">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-bold text-slate-300">Email</span>
                      <span className="relative block">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="focus-ring h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-500"
                          placeholder="kamu@email.com"
                          required
                        />
                      </span>
                    </label>
                    <Button className="h-12 w-full rounded-2xl bg-teal-500 text-slate-950 hover:bg-teal-300" disabled={loading}>
                      {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setError('')
                        setMessage('')
                      }}
                      className="w-full rounded-2xl px-4 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      Kembali ke login
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={signInWithGoogle}
                      disabled={loading}
                      className="group auth-premium-button"
                    >
                      {loading ? (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-900">
                          G
                        </span>
                      )}
                      {loading ? 'Menghubungkan...' : mode === 'signup' ? 'Daftar dengan Google' : 'Masuk dengan Google'}
                      {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                    </button>

                    <div className="flex items-start gap-2 rounded-2xl border border-teal-200/10 bg-teal-200/[0.06] p-3 text-xs leading-5 text-teal-50/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-200" />
                      <p>Login ini tidak meminta password kampus. NEXA hanya memakai Google OAuth untuk akun beta.</p>
                    </div>

                    {mode === 'login' && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                        <p className="text-xs text-slate-500">Lupa akses akun?</p>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot')
                            setError('')
                            setMessage('')
                          }}
                          className="mt-1 text-sm font-bold text-teal-200 transition hover:text-teal-100"
                        >
                          Kirim link reset via email
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                    {error}
                  </p>
                )}
                {message && (
                  <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-100">
                    {message}
                  </p>
                )}

                <div className="mt-5 flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-xs leading-5 text-slate-400">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-200" />
                  <p>NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
