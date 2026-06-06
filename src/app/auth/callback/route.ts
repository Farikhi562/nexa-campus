import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/dashboard'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[Auth Callback] exchange error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  if (next !== '/auth/update-password') {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, profile_completed')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email ?? '',
          full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          plan: 'radar',
          profile_completed: false,
        })
      }

      if (!profile?.profile_completed) {
        const referralCode = next.startsWith('/onboarding?ref=')
          ? next.split('ref=')[1]
          : ''
        const onboardingPath = referralCode
          ? `/onboarding?ref=${encodeURIComponent(decodeURIComponent(referralCode))}`
          : '/onboarding'

        return NextResponse.redirect(`${origin}${onboardingPath}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
