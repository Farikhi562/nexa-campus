'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import NexaLogo from '@/components/NexaLogo'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordClient() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function prepareRecoverySession() {
      setCheckingSession(true)
      setError('')

      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setError('Link reset tidak bisa diproses. Minta link reset baru dari halaman login.')
          setReady(false)
          setCheckingSession(false)
          return
        }
        window.history.replaceState({}, '', '/auth/update-password')
      }

      const { data } = await supabase.auth.getSession()
      setReady(Boolean(data.session))
      if (!data.session) {
        setError('Session reset belum aktif. Buka link terbaru dari email reset password.')
      }
      setCheckingSession(false)
    }

    prepareRecoverySession()
  }, [supabase])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password belum sama.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('Password gagal diubah. Coba minta link reset baru.')
      return
    }

    router.replace('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <NexaLogo className="h-11 w-11" />
          <div>
            <p className="text-lg font-black">NEXA Campus</p>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">Reset Password</p>
          </div>
        </div>

        <h1 className="text-2xl font-black tracking-tight">Bikin password baru.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Link reset dari email sudah menyiapkan session sementara. Tinggal set password baru yang kuat.
        </p>

        {checkingSession ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            Memeriksa link reset...
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-300">Password baru</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="focus-ring h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white"
                placeholder="Minimal 8 karakter"
                disabled={!ready || loading}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-300">Konfirmasi password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="focus-ring h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white"
                placeholder="Ulangi password baru"
                disabled={!ready || loading}
                required
              />
            </label>

            {error && (
              <p className="rounded-2xl border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                {error}
              </p>
            )}

            <Button type="submit" disabled={!ready || loading} className="h-12 w-full rounded-2xl bg-teal-500 text-slate-950 hover:bg-teal-300">
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
