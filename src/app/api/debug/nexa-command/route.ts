import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlanAccess } from '@/lib/billing/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'not_logged_in' }, { status: 401 })
  }

  const access = await getUserPlanAccess({ supabase, user: { id: user.id, email: user.email } })

  const env = {
    hasAiKey:
      Boolean(process.env.GEMINI_API_KEY) ||
      Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) ||
      Boolean(process.env.OPENAI_API_KEY) ||
      Boolean(process.env.ANTHROPIC_API_KEY),
    hasOwnerEmails: Boolean(process.env.NEXA_OWNER_EMAILS),
    hasCommandLifetimeEmails: Boolean(process.env.COMMAND_LIFETIME_EMAILS),
    hasAdminEmails: Boolean(process.env.ADMIN_EMAILS),
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
    },
    access: {
      plan: access?.plan ?? null,
      ownerOverride: access?.ownerOverride ?? false,
      profile: access?.profile ?? null,
      usageToday: access?.usageToday ?? {},
    },
    env,
    note: 'Kalau plan command tapi assistant error, buka Vercel Runtime Logs untuk /api/nexa-assistant/command. Kalau hasAiKey false, patch v1.6.35 tetap pakai local fallback.',
  })
}
