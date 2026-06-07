export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArenaView from '@/components/dashboard/ArenaView'

export const metadata = { title: 'NEXA Arena · Cari Tim Lomba' }

export default async function ArenaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <ArenaView userId={user.id} />
}
