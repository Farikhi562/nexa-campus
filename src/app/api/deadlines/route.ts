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
  if ('error' in parsed) return badRequest(parsed.error ?? 'Payload tidak valid.')

  const payloadData = parsed.data

  const { data, error } = await supabase
    .from('academic_deadlines')
    .insert({
      user_id: user.id,
      ...payloadData,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data?.id) {
    await supabase.rpc('award_points', { p_kind: 'create_deadline', p_ref: data.id }).then(undefined, () => null)

    if (payloadData.is_recurring && payloadData.deadline_date) {
      try {
        const anchor = new Date(`${payloadData.deadline_date}T00:00:00`)
        const instances = Array.from({ length: 8 }, (_, i) => {
          const d = new Date(anchor)
          d.setDate(d.getDate() + (i + 1) * 7)
          return {
            user_id: user.id,
            ...payloadData,
            deadline_date: d.toISOString().slice(0, 10),
            recurrence_parent_id: data.id,
            status: 'pending',
          }
        })
        await supabase.from('academic_deadlines').insert(instances).then(undefined, (err: Error) => {
          console.error('[recurring] gagal generate instances:', err?.message)
        })
      } catch (err) {
        console.error('[recurring] error:', err)
      }
    }
  }

  return NextResponse.json({ data }, { status: 201 })
}
