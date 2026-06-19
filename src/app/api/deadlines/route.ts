import { NextRequest, NextResponse } from 'next/server'
import { parseDeadlinePayload, type DeadlinePayload } from '@/lib/deadline-validation'
import { createClient } from '@/lib/supabase/server'

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  }

  let body: DeadlinePayload
  try {
    body = (await request.json()) as DeadlinePayload
  } catch {
    return badRequest('Request tidak valid.')
  }

  const parsed = parseDeadlinePayload(body)
  if (parsed.error) return badRequest(parsed.error)

  const { data, error } = await supabase
    .from('academic_deadlines')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Poin leaderboard: catat deadline (+2). Idempotent per deadline. Diabaikan
  // kalau fitur leaderboard belum di-setup.
  if (data?.id) {
    await supabase.rpc('award_points', { p_kind: 'create_deadline', p_ref: data.id }).then(undefined, () => null)
  }

  return NextResponse.json({ data }, { status: 201 })
}
