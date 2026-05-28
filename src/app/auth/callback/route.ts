import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Log errors from Supabase OAuth provider
  if (error) {
    console.error('OAuth Error:', error, error_description)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('OAuth exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/auth/login?error=exchange_failed&error_description=${encodeURIComponent(exchangeError.message)}`
      )
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=no_user&error_description=${encodeURIComponent('Login berhasil diproses, tapi session user tidak ditemukan.')}`
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.profile_completed) {
      return NextResponse.redirect(`${origin}/dashboard/setup-profile`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
