import Link from 'next/link'
import ProfileSettingsForm from '@/components/ProfileSettingsForm'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Profile Settings</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Edit profil</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Ubah identitas kampus, foto, deskripsi publik/privat, skill, minat, link portfolio, dan badge yang tampil di profil publik
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          Kembali ke Settings
        </Link>
      </div>

      <ProfileSettingsForm profile={profile as Profile} />
    </div>
  )
}
