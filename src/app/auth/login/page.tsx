'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Store,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import NexaLogo from '@/components/NexaLogo'

type AuthMode = 'login' | 'signup' | 'magic'

const BLOCKED_TEST_DOMAINS = ['example.com', 'example.net', 'example.org', 'test.com']
const AUTH_CALLBACK_URL = 'https://campus.nexatechlabs.my.id/auth/callback'

function getAuthCallbackUrl() {
  return AUTH_CALLBACK_URL
}

function validateEmailForAuth(value: string) {
  const email = value.trim().toLowerCase()
  const domain = email.split('@')[1]

  if (!email) return 'Email wajib diisi.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format email belum valid.'
  if (domain && BLOCKED_TEST_DOMAINS.includes(domain)) {
    return 'Pakai email asli ya. Domain seperti example.com/test.com ditolak oleh Supabase Auth.'
  }

  return ''
}

function humanizeAuthError(message: string) {
  const lower = message.toLowerCase()

  if (lower.includes('email address') && lower.includes('invalid')) {
    return 'Email ini ditolak oleh auth provider. Coba pakai email asli seperti Gmail atau email kampus.'
  }
  if (lower.includes('invalid login credentials')) {
    return 'Email/password salah, atau email baru belum dikonfirmasi. Kalau baru daftar, cek inbox/spam lalu klik link konfirmasi.'
  }
  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return 'Email belum dikonfirmasi. Cek inbox/spam, klik link konfirmasi, lalu login lagi.'
  }
  if (lower.includes('signup') && lower.includes('disabled')) {
    return 'Pendaftaran email/password belum aktif. Aktifkan Email provider di dashboard Supabase.'
  }
  if (lower.includes('already registered') || lower.includes('user already registered')) {
    return 'Email ini sudah terdaftar. Pindah ke tab Masuk untuk login.'
  }
  if (lower.includes('password')) {
    return message
  }

  return message
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<AuthMode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isSignup = mode === 'signup'
  const isMagic = mode === 'magic'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setError(params.get('error_description') || '')
  }, [])

  async function ensureProfile(userId: string, userEmail: string, userName?: string) {
    // Check if profile exists
    const { data: existing, error: checkErr } = await supabase
      .from('profiles')
      .select('id, profile_completed')
      .eq('id', userId)
      .maybeSingle()

    if (checkErr) {
      console.error('[ensureProfile] check error:', checkErr)
    }

    if (!existing) {
      // Create profile for new user — this is the bug fix for new user login
      const { error: createErr } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          full_name: userName?.trim() || null,
          plan: 'free',
          profile_completed: false,
        })

      if (createErr && createErr.code !== '23505') {
        // 23505 = unique violation (profile already created by trigger)
        console.error('[ensureProfile] create error:', createErr)
      }

      return false // Not completed
    }

    return Boolean(existing.profile_completed)
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    const emailError = validateEmailForAuth(email)
    if (emailError) {
      setError(emailError)
      return
    }
    if (!password) return
    if (isSignup && password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setLoading(true)

    if (isSignup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: { full_name: fullName.trim() },
        },
      })

      if (signUpError) {
        setError(humanizeAuthError(signUpError.message))
        setLoading(false)
        return
      }

      // FIX: If session is returned (email confirmation disabled), create profile & redirect
      if (data.user && data.session) {
        await ensureProfile(data.user.id, data.user.email || email.trim(), fullName.trim())
        router.push('/dashboard/setup-profile')
        return
      }

      // Email confirmation required
      setMessage('Akun dibuat! Cek inbox/spam kamu untuk link konfirmasi, lalu login dengan password ini.')
      setLoading(false)
      return
    }

    // Login
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError(humanizeAuthError(signInError.message))
      setLoading(false)
      return
    }

    if (data.user) {
      // Ensure profile exists (fixes new users who confirmed email but profile wasn't created)
      const completed = await ensureProfile(data.user.id, data.user.email || email.trim())
      router.push(completed ? '/dashboard' : '/dashboard/setup-profile')
      return
    }

    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    const emailError = validateEmailForAuth(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    })

    setLoading(false)

    if (otpError) {
      setError(humanizeAuthError(otpError.message))
    } else {
      setMessage(`Magic link dikirim ke ${email.trim()}. Cek inbox/spam kamu.`)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    setMessage('')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
      },
    })

    if (oauthError) {
      setError(humanizeAuthError(oauthError.message))
      setGoogleLoading(false)
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left panel — only on large screens */}
        <section className="relative hidden overflow-hidden px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.24),transparent_38%),linear-gradient(315deg,rgba(16,185,129,0.16),transparent_34%)]" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <NexaLogo className="h-11 w-11 rounded-xl bg-white" />
              <div>
                <p className="text-xl font-black tracking-tight">NEXA</p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Campus Ecosystem</p>
              </div>
            </Link>
          </div>

          <div className="relative max-w-xl">
            <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              Untuk belajar, komunitas, dan peluang kampus
            </p>
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Satu akun untuk kelas, ujian, dan marketplace mahasiswa.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              NEXA menyatukan mock exam berbasis AI, study room, jadwal ujian, dan jual beli barang atau jasa antar mahasiswa dalam satu ekosistem yang rapi.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {[
              { icon: BookOpenCheck, label: 'Mock exam AI' },
              { icon: Users, label: 'Study room' },
              { icon: Store, label: 'Marketplace' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <Icon className="mb-3 h-5 w-5 text-cyan-200" />
                <p className="text-sm font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right panel — auth form */}
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950 sm:px-6">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <Link href="/" className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <NexaLogo className="h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200" />
              <div>
                <p className="text-lg font-black leading-5">NEXA</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Campus Ecosystem</p>
              </div>
            </Link>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
              <div className="mb-5">
                <p className="text-sm font-semibold text-brand-600">Selamat datang</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  {isSignup ? 'Buat akun mahasiswa' : isMagic ? 'Masuk pakai magic link' : 'Masuk ke NEXA'}
                </h1>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  {isSignup
                    ? 'Daftar dengan email kampus atau email pribadi kamu.'
                    : 'Lanjutkan belajar, cek room, atau buka marketplace kampusmu.'}
                </p>
              </div>

              {/* Mode tabs */}
              <div className="mb-4 grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
                {[
                  { id: 'login', label: 'Masuk' },
                  { id: 'signup', label: 'Daftar' },
                  { id: 'magic', label: 'Link' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchMode(item.id as AuthMode)}
                    className={`rounded-lg px-3 py-2 transition ${
                      mode === item.id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-xs font-black text-brand-700">
                    G
                  </span>
                )}
                {googleLoading ? 'Memproses...' : 'Masuk dengan Google'}
              </button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 font-semibold uppercase tracking-wide text-slate-400">atau</span>
                </div>
              </div>

              <form onSubmit={isMagic ? handleMagicLink : handlePasswordAuth} className="space-y-4">
                {isSignup && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nama lengkap</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama kamu"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="kamu@email.com"
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      required
                    />
                  </div>
                </div>

                {!isMagic && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isSignup ? 'Minimal 6 karakter' : 'Password akun kamu'}
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-12 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 rounded-md p-1 -translate-y-1/2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <p className="text-sm leading-5 text-red-700">{error}</p>
                  </div>
                )}

                {message && (
                  <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <p className="text-sm leading-5 text-emerald-700">{message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim() || (!isMagic && !password)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <>
                      {isSignup ? 'Buat Akun' : isMagic ? 'Kirim Magic Link' : 'Masuk'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Dengan masuk, kamu bisa memakai fitur belajar gratis. Fitur marketplace dibuka untuk paket Basic dan Pro.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
