import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NotificationCenterView from '@/components/dashboard/NotificationCenterView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notifikasi · NEXA Campus' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <NotificationCenterView />
}
