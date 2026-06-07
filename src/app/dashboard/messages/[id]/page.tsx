export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import PrivateChatView from '@/components/dashboard/PrivateChatView'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  return { title: `Chat · ${id.slice(0, 8)} · NEXA Campus` }
}

export default async function PrivateMessagePage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <PrivateChatView friendId={id} userId={user.id} />
}
