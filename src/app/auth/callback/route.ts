import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorDescription = searchParams.get('error_description')

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Kode OAuth tidak ditemukan.')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Session user tidak ditemukan.')}`)
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, profile_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) {
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      plan: 'radar',
      profile_completed: false,
    })
  }

  return NextResponse.redirect(`${origin}${existing?.profile_completed ? '/dashboard' : '/onboarding'}`)
}
