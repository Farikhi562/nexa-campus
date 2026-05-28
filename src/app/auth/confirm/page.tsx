'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import NexaLogo from '@/components/NexaLogo'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function exchangeCode() {
      if (!code) {
        setError('Tidak ada kode autentikasi')
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Give browser time to restore cookies from storage
        await new Promise(resolve => setTimeout(resolve, 100))

        // Exchange code for session using browser client
        const { error: exchangeError, data: { session } } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('Exchange error:', exchangeError)
          setError(`Gagal: ${exchangeError.message}`)
          setLoading(false)
          return
        }

        console.log('Session exchanged, user:', session?.user?.id)

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Gagal mendapatkan data user')
          setLoading(false)
          return
        }

        console.log('User authenticated:', user.id)

        // Wait a bit for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if profile exists
        const { data: profile, error: selectError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (selectError && selectError.code !== 'PGRST116') {
          console.error('Select profile error:', selectError)
        }

        console.log('Profile data:', profile)

        // If profile doesn't exist, create it (trigger might have failed)
        if (!profile) {
          console.log('Profile tidak ditemukan, membuat baru...')
          const { error: createError, data: newProfile } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email || '',
            profile_completed: false,
          }).select().single()

          if (createError) {
            console.error('Create profile error:', createError)
            // Still continue even if there's an error, profile might have been created by trigger
          } else {
            console.log('Profile berhasil dibuat:', newProfile)
          }
        }

        // Clear PKCE from storage
        if (typeof localStorage !== 'undefined') {
          const keys = Object.keys(localStorage)
          keys.forEach((key) => {
            if (key.includes('pkce')) {
              localStorage.removeItem(key)
            }
          })
        }

        // Get final profile status
        const { data: finalProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        console.log('Final profile:', finalProfile)

        // Redirect to setup if profile not completed, else dashboard
        if (!finalProfile?.profile_completed) {
          console.log('Redirecting to setup-profile')
          window.location.href = '/dashboard/setup-profile'
        } else {
          console.log('Redirecting to dashboard')
          window.location.href = '/dashboard'
        }
      } catch (err) {
        console.error('Confirm error:', err)
        setError('Terjadi kesalahan saat konfirmasi')
        setLoading(false)
      }
    }

    exchangeCode()
  }, [code])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8">
        <NexaLogo className="h-12 w-12 rounded-xl bg-white shadow-lg" />
        <div>
          <h1 className="text-2xl font-black text-white">NEXA</h1>
          <p className="text-xs text-brand-300">Campus Ecosystem</p>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
        {loading ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="animate-spin w-8 h-8 text-brand-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="font-sans text-xl font-bold text-slate-900 mb-2">Mengonfirmasi login...</h2>
            <p className="text-slate-500 text-sm">Tunggu sebentar, kami sedang memverifikasi akun kamu.</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="font-sans text-xl font-bold text-slate-900 mb-2">Login gagal</h2>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <Link
              href="/auth/login"
              className="inline-block px-4 py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
            >
              Kembali ke Login
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 px-4">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-slate-700 shadow-2xl">
          Memuat konfirmasi login...
        </div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}
