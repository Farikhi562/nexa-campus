import { NextRequest, NextResponse } from 'next/server'
import {
  parseDeadlinePayload,
  parseStatusPatch,
  type DeadlinePayload,
} from '@/lib/deadline-validation'
import { createClient } from '@/lib/supabase/server'

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

async function getAuthedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data, error } = await supabase
    .from('academic_deadlines')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: DeadlinePayload & { mode?: unknown }
  try {
    body = (await request.json()) as DeadlinePayload & { mode?: unknown }
  } catch {
    return badRequest('Request tidak valid.')
  }

  const parsed = body.mode === 'status' ? parseStatusPatch(body.status) : parseDeadlinePayload(body)

  if (parsed.error) return badRequest(parsed.error)
  if (!parsed.data) return badRequest('Request tidak valid.')

  const { data, error } = await supabase
    .from('academic_deadlines')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  // Poin leaderboard saat deadline ditandai selesai (idempotent per deadline).
  // Diabaikan kalau fitur leaderboard belum di-setup.
  if (data?.status === 'completed') {
    await supabase
      .rpc('award_points', { p_kind: 'complete_deadline', p_points: 10, p_ref: data.id })
      .then(undefined, () => null)
    const today = new Date().toISOString().slice(0, 10)
    if (typeof data.deadline_date === 'string' && today <= data.deadline_date) {
      await supabase
        .rpc('award_points', { p_kind: 'ontime_bonus', p_points: 5, p_ref: data.id })
        .then(undefined, () => null)
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { error, count } = await supabase
    .from('academic_deadlines')
    .delete({ count: 'exact' })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!count) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  return NextResponse.json({ data: { id: params.id } })
}
