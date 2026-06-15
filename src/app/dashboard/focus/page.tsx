import { redirect } from 'next/navigation'
import FocusMode from '@/components/dashboard/FocusMode'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Focus Mode · NEXA Campus',
  description: 'Timer Pomodoro untuk fokus mengerjakan tugas. Selesaikan sesi fokus harian dan kumpulin poin',
}

export default async function FocusPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <FocusMode />
}
