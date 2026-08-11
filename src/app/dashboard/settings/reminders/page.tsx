import Link from 'next/link'
import ReminderSettingsForm from '@/components/ReminderSettingsForm'
import PushNotificationSettings from '@/components/settings/PushNotificationSettings'
import WhatsAppReminderSettings from '@/components/settings/WhatsAppReminderSettings'
import DeadlineAutoDeleteSettings from '@/components/settings/DeadlineAutoDeleteSettings'
import { createClient } from '@/lib/supabase/server'
import type { Profile, ReminderPreferences } from '@/types'

export default async function ReminderSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: preferences }, { data: pushPreferences }, { data: waPreferences }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase
      .from('reminder_preferences')
      .select('*')
      .eq('user_id', user!.id)
      .eq('channel', 'telegram')
      .maybeSingle(),
    supabase
      .from('reminder_preferences')
      .select('*')
      .eq('user_id', user!.id)
      .eq('channel', 'push')
      .maybeSingle(),
    supabase
      .from('reminder_preferences')
      .select('*')
      .eq('user_id', user!.id)
      .eq('channel', 'whatsapp')
      .maybeSingle(),
  ])

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-200/70 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-700">Reminder Settings</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Pengaturan Reminder</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Atur notifikasi HP, Telegram, WhatsApp, dan auto-hapus deadline yang sudah lewat untuk deadline yang kamu input manual.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
          >
            Kembali ke Settings
          </Link>
        </div>
      </div>

      <PushNotificationSettings
        userId={(profile as Profile).id}
        initialPreferences={pushPreferences as Partial<ReminderPreferences> | null}
      />

      <ReminderSettingsForm
        profile={profile as Profile}
        preferences={preferences as ReminderPreferences | null}
        telegramConfigured={Boolean(process.env.TELEGRAM_BOT_TOKEN)}
      />

      <WhatsAppReminderSettings
        userId={(profile as Profile).id}
        waConfigured={Boolean(process.env.WABLAS_API_URL && process.env.WABLAS_TOKEN)}
        initialWhatsAppNumber={(profile as Profile).whatsapp_number}
        initialPreferences={waPreferences as Partial<ReminderPreferences> | null}
      />

      <DeadlineAutoDeleteSettings
        userId={(profile as Profile).id}
        initialEnabled={(profile as Profile).auto_delete_expired_deadlines ?? false}
        initialDays={(profile as Profile).auto_delete_expired_after_days ?? 7}
      />
    </div>
  )
}
