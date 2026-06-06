import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FriendsView from '@/components/dashboard/FriendsView'

export const metadata = { title: 'Cari Teman · NEXA Campus' }

export default async function FriendsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <FriendsView />
}
