import { redirect } from 'next/navigation'
import LeaderboardView from '@/components/dashboard/LeaderboardView'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Leaderboard · NEXA Campus',
  description: 'Papan peringkat NEXA Campus. Kumpulkan poin dari deadline yang kamu selesaikan dan saingi teman serta kampusmu.',
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <LeaderboardView currentUserId={user.id} />
}
