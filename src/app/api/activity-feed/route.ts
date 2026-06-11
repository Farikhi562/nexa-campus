import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type ProfileRow = {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  nexa_id?: string | null
}

type FeedItem = {
  id: string
  type: string
  title: string
  description: string
  created_at: string
  points?: number | null
  actor?: {
    id: string
    name: string | null
    avatar_url?: string | null
    nexa_id?: string | null
  } | null
}

function getDataClient(fallback: Awaited<ReturnType<typeof createClient>>) {
  try {
    return createServiceClient()
  } catch {
    return fallback
  }
}

function titleForKind(kind: string, name: string, points: number) {
  const safeName = name || 'Mahasiswa NEXA'
  if (kind.includes('complete_deadline')) return `${safeName} menyelesaikan deadline`
  if (kind.includes('daily')) return `${safeName} check-in Daily Pulse`
  if (kind.includes('referral')) return `${safeName} mengajak pengguna baru`
  if (kind.includes('arena')) return `${safeName} aktif di NEXA Arena`
  if (kind.includes('study')) return `${safeName} aktif di Study Room`
  if (kind.includes('leaderboard') || kind.includes('champion')) return `${safeName} naik di leaderboard`
  if (points > 0) return `${safeName} mendapatkan ${points} poin`
  return `${safeName} bergerak di NEXA Campus`
}

function descriptionForKind(kind: string, points: number) {
  if (kind.includes('complete_deadline')) return 'Satu tugas beres. Peradaban akademik masih punya harapan kecil.'
  if (kind.includes('daily')) return 'Check-in harian masuk. Streak dan konsistensi mulai dibangun.'
  if (kind.includes('referral')) return 'Referral aktif. Teman baru berhasil bergabung lewat link kamu.'
  if (kind.includes('arena')) return 'Aktivitas Arena tercatat. Cari tim mulai jadi fitur yang hidup.'
  if (kind.includes('study')) return 'Aktivitas belajar bareng tercatat di Study Room.'
  if (kind.includes('leaderboard') || kind.includes('champion')) return 'Kompetisi mingguan dan bulanan mulai terasa.'
  if (points > 0) return `Aktivitas ini memberi ${points} poin.`
  return 'Aktivitas baru tercatat di platform.'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const db = getDataClient(supabase)

  try {
    const { data: events, error } = await db
      .from('points_events')
      .select('id, user_id, kind, points, created_at')
      .order('created_at', { ascending: false })
      .limit(18)

    if (error) throw error

    const rows = (events ?? []) as Array<{
      id?: string
      user_id: string
      kind?: string | null
      points?: number | null
      created_at?: string | null
    }>

    const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)))
    let profilesById = new Map<string, ProfileRow>()

    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, avatar_url, nexa_id')
        .in('id', userIds)

      profilesById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
    }

    const feed: FeedItem[] = rows.map((row, index) => {
      const profile = profilesById.get(row.user_id)
      const name = profile?.full_name ?? 'Mahasiswa NEXA'
      const kind = row.kind ?? 'activity'
      const points = Number(row.points ?? 0)
      return {
        id: row.id ?? `${row.user_id}-${row.created_at ?? index}`,
        type: kind,
        title: titleForKind(kind, name, points),
        description: descriptionForKind(kind, points),
        created_at: row.created_at ?? new Date().toISOString(),
        points,
        actor: {
          id: row.user_id,
          name,
          avatar_url: profile?.avatar_url ?? null,
          nexa_id: profile?.nexa_id ?? null,
        },
      }
    })

    return NextResponse.json({ data: feed })
  } catch {
    // Fallback agar dashboard tetap berjalan jika points_events belum terbaca RLS/schema.
    const { data: ownDeadlines } = await supabase
      .from('academic_deadlines')
      .select('id, title, course_name, updated_at, created_at, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(6)

    const fallback = ((ownDeadlines ?? []) as Array<{
      id: string
      title?: string | null
      course_name?: string | null
      updated_at?: string | null
      created_at?: string | null
    }>).map((deadline) => ({
      id: `deadline-${deadline.id}`,
      type: 'complete_deadline',
      title: `Kamu menyelesaikan ${deadline.title || deadline.course_name || 'deadline'}`,
      description: 'Aktivitas personal tercatat. Feed publik akan lebih ramai setelah points_events terbaca.',
      created_at: deadline.updated_at ?? deadline.created_at ?? new Date().toISOString(),
      points: null,
      actor: null,
    }))

    return NextResponse.json({ data: fallback })
  }
}
