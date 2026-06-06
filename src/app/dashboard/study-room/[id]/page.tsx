import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudyRoomDetail from '@/components/dashboard/StudyRoomDetail'

export const metadata = { title: 'Study Room · NEXA Campus' }

type Params = { params: Promise<{ id: string }> }

export default async function StudyRoomDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <StudyRoomDetail roomId={id} userId={user.id} />
}
