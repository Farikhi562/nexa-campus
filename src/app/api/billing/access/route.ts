import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'

export async function GET() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Login dulu buat cek akses plan.' }, { status: 401 })
  }

  const access = await getUserPlanAccess({ supabase, user })
  return NextResponse.json(access)
}
