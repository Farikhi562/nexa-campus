import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string; applicationId: string }> }

function text(value: unknown, max = 1500) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

async function notifyApplicant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicantId: string,
  action: 'accept' | 'reject',
  postTitle: string
) {
  await supabase.from('notifications').insert({
    user_id: applicantId,
    type: action === 'accept' ? 'arena_application_accepted' : 'arena_application_rejected',
    title: action === 'accept' ? 'Lamaran Arena diterima' : 'Lamaran Arena ditolak',
    message: action === 'accept'
      ? `Kamu diterima di postingan "${postTitle}". Mantap, ada yang percaya sama skill kamu.`
      : `Lamaran kamu di postingan "${postTitle}" belum diterima. Sakit sedikit, tapi bukan akhir dunia coding.` ,
    link: '/dashboard/arena',
    is_read: false,
  })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, applicationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid.' }, { status: 400 }) }

  const action = body.action === 'accept' ? 'accept' : body.action === 'reject' ? 'reject' : null
  if (!action) return NextResponse.json({ error: 'Action tidak valid.' }, { status: 400 })

  const { data: post, error: postError } = await supabase
    .from('nexa_arena_posts')
    .select('id, creator_id, title, status, current_team_size, team_size_max')
    .eq('id', id)
    .maybeSingle()

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 })
  if (!post) return NextResponse.json({ error: 'Postingan tidak ditemukan.' }, { status: 404 })

  const arenaPost = post as { creator_id: string; title: string; status: string; current_team_size: number; team_size_max: number }
  if (arenaPost.creator_id !== user.id) {
    return NextResponse.json({ error: 'Hanya pembuat postingan yang bisa memproses pelamar.' }, { status: 403 })
  }

  const { data: application, error: appError } = await supabase
    .from('nexa_arena_applications')
    .select('id, applicant_id, status')
    .eq('id', applicationId)
    .eq('post_id', id)
    .maybeSingle()

  if (appError) return NextResponse.json({ error: appError.message }, { status: 500 })
  if (!application) return NextResponse.json({ error: 'Lamaran tidak ditemukan.' }, { status: 404 })

  const app = application as { id: string; applicant_id: string; status: string }
  if (app.status !== 'pending') {
    return NextResponse.json({ error: 'Lamaran ini sudah diproses.' }, { status: 400 })
  }

  if (action === 'accept') {
    if (arenaPost.current_team_size >= arenaPost.team_size_max) {
      return NextResponse.json({ error: 'Tim sudah penuh.' }, { status: 400 })
    }
    if (body.competency_confirmed !== true) {
      return NextResponse.json({ error: 'Kamu wajib konfirmasi bahwa skill/latar belakang pelamar sudah dicek.' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('nexa_arena_applications')
    .update({
      status: action === 'accept' ? 'accepted' : 'rejected',
      review_note: text(body.review_note) || null,
      competency_confirmed: action === 'accept',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('post_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'accept') {
    const joinedAt = new Date().toISOString()
    const { error: memberError } = await supabase
      .from('nexa_arena_team_members')
      .upsert(
        {
          post_id: id,
          user_id: app.applicant_id,
          role: 'member',
          source_application_id: applicationId,
          joined_at: joinedAt,
        },
        { onConflict: 'post_id,user_id' }
      )

    if (memberError) {
      console.error('[Arena Team Member] failed:', memberError)
      return NextResponse.json({ error: `Lamaran diterima, tapi gagal memasukkan ke anggota tim: ${memberError.message}` }, { status: 500 })
    }

    const nextTeamSize = Math.min(arenaPost.team_size_max, arenaPost.current_team_size + 1)
    await supabase
      .from('nexa_arena_posts')
      .update({
        current_team_size: nextTeamSize,
        status: nextTeamSize >= arenaPost.team_size_max ? 'full' : arenaPost.status,
        updated_at: joinedAt,
      })
      .eq('id', id)
      .eq('creator_id', user.id)

    await supabase.from('points_events').insert({
      user_id: app.applicant_id,
      kind: 'arena_approved',
      points: 20,
      metadata: { post_id: id, application_id: applicationId },
    }).then(undefined, () => null)
  }

  try { await notifyApplicant(supabase, app.applicant_id, action, arenaPost.title) } catch (error) { console.error('[Arena Review Notification]', error) }

  return NextResponse.json({ data })
}
