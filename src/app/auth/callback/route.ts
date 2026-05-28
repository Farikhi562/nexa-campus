import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

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
        `${origin}/auth/login?error=no_user&error_description=${encodeURIComponent('Session user tidak ditemukan.')}`
      )
    }

    // FIX: Ensure profile exists for new users (e.g. Google OAuth first login)
    const serviceClient = createServiceClient()

    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('id, profile_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      // Create profile — handles case where DB trigger didn't fire
      await serviceClient.from('profiles').insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        plan: 'free',
        profile_completed: false,
      }).onConflict('id').ignore()
    }

    const profileCompleted = existingProfile?.profile_completed ?? false

    if (!profileCompleted) {
      return NextResponse.redirect(`${origin}/dashboard/setup-profile`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
