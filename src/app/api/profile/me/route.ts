import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan, isFounderEmail } from '@/lib/plans'
import { BADGES } from '@/lib/badges'

type MissingItem = { key: string; label: string; href: string }

type ProfileMeRow = {
  featured_badge?: string | null
  nexa_id?: string | null
  email?: string | null
  plan?: string | null
  pulse_trial_until?: string | null
  plan_expires_at?: string | null
  subscription_expires_at?: string | null
  command_expires_at?: string | null
  lifetime_command?: boolean | null
  badges?: unknown
  founder_verified?: boolean | null
  full_name?: string | null
  campus_name?: string | null
  major?: string | null
  semester?: number | null
  avatar_url?: string | null
  public_profile_headline?: string | null
  profile_bio?: string | null
  profile_skills?: string[] | null
  profile_interests?: string[] | null
  portfolio_url?: string | null
  github_url?: string | null
  linkedin_url?: string | null
  telegram_chat_id?: string | null
}

function hasText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasArray(value: unknown) {
  return Array.isArray(value) && value.filter(Boolean).length > 0
}

function getProfileCompletion(profile: ProfileMeRow | null) {
  const checks: Array<{ key: string; label: string; href: string; done: boolean }> = [
    { key: 'avatar', label: 'Foto profil', href: '/dashboard/settings/profile', done: hasText(profile?.avatar_url) },
    { key: 'name', label: 'Nama lengkap', href: '/dashboard/settings/profile', done: hasText(profile?.full_name) },
    { key: 'campus', label: 'Kampus', href: '/dashboard/settings/profile', done: hasText(profile?.campus_name) },
    { key: 'major', label: 'Jurusan', href: '/dashboard/settings/profile', done: hasText(profile?.major) },
    { key: 'headline', label: 'Headline profil', href: '/dashboard/settings/profile', done: hasText(profile?.public_profile_headline) },
    { key: 'bio', label: 'Deskripsi diri', href: '/dashboard/settings/profile', done: hasText(profile?.profile_bio) },
    { key: 'skills', label: 'Skill', href: '/dashboard/settings/profile', done: hasArray(profile?.profile_skills) },
    { key: 'interests', label: 'Minat belajar', href: '/dashboard/settings/profile', done: hasArray(profile?.profile_interests) },
    { key: 'portfolio', label: 'Portfolio/GitHub/LinkedIn', href: '/dashboard/settings/profile', done: hasText(profile?.portfolio_url) || hasText(profile?.github_url) || hasText(profile?.linkedin_url) },
    { key: 'badge', label: 'Featured badge', href: '/dashboard/achievements', done: hasText(profile?.featured_badge) },
  ]

  const completed = checks.filter((item) => item.done).map((item) => item.key)
  const missing: MissingItem[] = checks.filter((item) => !item.done).map(({ key, label, href }) => ({ key, label, href }))
  const percent = Math.round((completed.length / checks.length) * 100)

  return {
    percent,
    completed,
    missing,
    nextAction: missing[0]
      ? { label: `Lengkapi ${missing[0].label}`, href: missing[0].href }
      : { label: 'Lihat profil publik', href: '/dashboard/settings/profile' },
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('featured_badge, nexa_id, email, plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command, badges, founder_verified, full_name, campus_name, major, semester, avatar_url, public_profile_headline, profile_bio, profile_skills, profile_interests, portfolio_url, github_url, linkedin_url, telegram_chat_id')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const profile = (data ?? null) as ProfileMeRow | null
  const founder = isFounderEmail(user.email) || Boolean(profile?.founder_verified)

  return NextResponse.json({
    ...(profile ?? {}),
    plan: getEffectivePlan({ ...(profile ?? {}), email: user.email }),
    founder_verified: founder,
    badges: founder ? BADGES.map((badge) => badge.id) : (profile?.badges ?? []),
    profile_completion: getProfileCompletion(profile),
  })
}
