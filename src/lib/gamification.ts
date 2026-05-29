import 'server-only'
import { BADGES, type BadgeId } from '@/lib/badges'

type SupabaseAdmin = ReturnType<typeof import('@/lib/supabase/server')['createServiceClient']>

function todayJakarta() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function uniqueBadges(existing: unknown, additions: BadgeId[]) {
  const current = Array.isArray(existing) ? existing.filter((item): item is string => typeof item === 'string') : []
  return Array.from(new Set([...current, ...additions]))
}

export async function updateLearningProgress({
  db,
  userId,
  documentId,
  sessionId,
  score,
}: {
  db: SupabaseAdmin
  userId: string
  documentId: string | null
  sessionId: string
  score: number
}) {
  const today = todayJakarta()

  const { data: todayRow } = await db
    .from('learning_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  const nextExams = (todayRow?.exams_completed ?? 0) + 1
  const prevAvg = todayRow?.avg_score ?? 0
  const nextAvg = Math.round(((prevAvg * (nextExams - 1)) + score) / nextExams)

  await db.from('learning_streaks').upsert({
    user_id: userId,
    date: today,
    exams_completed: nextExams,
    avg_score: nextAvg,
  }, { onConflict: 'user_id,date' })

  const [{ data: completedSessions, count: examsCount }, { count: docsCount }, { data: profile }] = await Promise.all([
    db
      .from('exam_sessions')
      .select('id, score', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    db
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    db
      .from('profiles')
      .select('badges')
      .eq('id', userId)
      .single(),
  ])

  const { data: recentDays } = await db
    .from('learning_streaks')
    .select('date, exams_completed')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30)

  const activeDates = new Set(
    ((recentDays ?? []) as Array<{ date: string; exams_completed: number }>)
      .filter((row) => row.exams_completed > 0)
      .map((row) => row.date)
  )
  let streak = 0
  const cursor = new Date(`${today}T00:00:00+07:00`)
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  const earned: BadgeId[] = []
  if ((examsCount ?? 0) >= 1) earned.push('first_exam')
  if (streak >= 7) earned.push('on_fire')
  if ((docsCount ?? 0) >= 5) earned.push('diligent')
  if (score === 100) earned.push('perfect_score')

  const before = Array.isArray(profile?.badges) ? profile.badges : []
  const after = uniqueBadges(before, earned)
  const newlyEarned = after.filter((badge) => !before.includes(badge))
  const scores = ((completedSessions ?? []) as Array<{ score: number | null }>).map((row) => Number(row.score) || 0)
  const avgScore = scores.length
    ? Math.round(scores.reduce((total: number, value: number) => total + value, 0) / scores.length)
    : score

  await db.from('profiles').update({ badges: after }).eq('id', userId)

  await db.from('notifications').insert({
    user_id: userId,
    title: 'Exam selesai',
    message: `Skor kamu ${score}/100. Mantap, lanjutkan ritmenya.`,
    type: 'exam_result',
  })

  if (newlyEarned.length > 0) {
    const badgeRows = newlyEarned.map((badgeId) => {
      const badge = BADGES.find((item) => item.id === badgeId)
      return {
        user_id: userId,
        title: 'Badge baru terbuka',
        message: `${badge?.icon ?? '🏅'} ${badge?.title ?? badgeId} berhasil kamu dapatkan.`,
        type: 'badge_earned',
      }
    })
    await db.from('notifications').insert(badgeRows)
  }

  await db.from('leaderboard_stats').upsert({
    user_id: userId,
    total_exams: examsCount ?? 0,
    avg_score: avgScore,
    current_streak: streak,
    last_session_id: sessionId,
    last_document_id: documentId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return { streak, badges: after, newlyEarned }
}
