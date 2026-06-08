import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArenaTeamWorkspaceView from '@/components/dashboard/ArenaTeamWorkspaceView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Arena Team Workspace · NEXA Campus' }

type Props = { params: Promise<{ id: string }> }

export default async function ArenaWorkspacePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <ArenaTeamWorkspaceView postId={id} userId={user.id} />
}
