import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudyRoomView from '@/components/dashboard/StudyRoomView'

export const metadata = { title: 'Study Room · NEXA Campus' }

export default async function StudyRoomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <StudyRoomView userId={user.id} />
}
