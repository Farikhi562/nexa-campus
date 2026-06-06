import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { action?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action : ''
  if (!['accept', 'reject'].includes(action))
    return NextResponse.json({ error: 'action harus "accept" atau "reject".' }, { status: 400 })

  // Only receiver can accept/reject
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', id)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', id)
    .eq('requester_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
