import Link from 'next/link'
import ReminderSettingsForm from '@/components/ReminderSettingsForm'
import { createClient } from '@/lib/supabase/server'
import type { Profile, ReminderPreferences } from '@/types'

export default async function ReminderSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase
      .from('reminder_preferences')
      .select('*')
      .eq('user_id', user!.id)
      .eq('channel', 'telegram')
      .maybeSingle(),
  ])

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-200/70 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-brand-700">Reminder Settings</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Pengaturan Telegram</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Aktifkan reminder Telegram untuk deadline yang kamu input manual. Kalau token sudah ada di env, restart server dev/deploy supaya kebaca.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
          >
            Kembali ke Settings
          </Link>
        </div>
      </div>

      <ReminderSettingsForm
        profile={profile as Profile}
        preferences={preferences as ReminderPreferences | null}
        telegramConfigured={Boolean(process.env.TELEGRAM_BOT_TOKEN)}
      />
    </div>
  )
}
