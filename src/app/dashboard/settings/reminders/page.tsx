import ReminderSettingsForm from '@/components/ReminderSettingsForm'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import type { Profile, ReminderPreferences } from '@/types'

export default async function ReminderSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('reminder_preferences').select('*').eq('user_id', user!.id).maybeSingle(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Reminder Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          MVP testing pakai struktur Telegram dulu. WhatsApp Wablas masuk roadmap produksi.
        </p>
      </div>
      <Card>
        <CardContent>
          <ReminderSettingsForm profile={profile as Profile} preferences={preferences as ReminderPreferences | null} />
        </CardContent>
      </Card>
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
        Reminder bisa gagal karena provider, jaringan, atau konfigurasi bot. Selalu cek info final dari kanal resmi kampus.
      </div>
    </div>
  )
}
