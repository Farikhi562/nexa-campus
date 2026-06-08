import Link from 'next/link'
import { BellRing, CreditCard, Globe, ShieldCheck, UserRound } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import DeleteAccountDangerZone from '@/components/DeleteAccountDangerZone'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LABELS } from '@/lib/nexa-data'
import type { Profile } from '@/types'
import { getEffectivePlan, planExpiresLabel } from '@/lib/plans'

const settingItems = [
  { title: 'Edit Profil', desc: 'Ubah nama, kampus, provinsi, gender opsional, dan foto profil.', href: '/dashboard/settings/profile', icon: UserRound },
  { title: 'Reminder Telegram', desc: 'Atur chat ID, jam reminder, dan kapan NEXA harus ngingetin.', href: '/dashboard/settings/reminders', icon: BellRing },
  { title: 'Billing & Upgrade', desc: 'Ajukan upgrade manual ke Pulse atau Command.', href: '/dashboard/billing', icon: CreditCard },
  { title: 'Privacy', desc: 'Cek data apa saja yang NEXA simpan dan tidak simpan.', href: '/privacy', icon: ShieldCheck },
]

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const typedProfile = profile as Profile
  const effectivePlan = getEffectivePlan({ ...typedProfile, email: user?.email })
  const expiresLabel = planExpiresLabel({ ...typedProfile, email: user?.email })

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Pengaturan</p>
              <h1 className="mt-1 text-xl font-black text-slate-950">{typedProfile.full_name || 'Akun NEXA'}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{typedProfile.email}</p>
              {typedProfile.nexa_id && <p className="mt-0.5 text-xs font-bold text-teal-600">Nexa ID: #{typedProfile.nexa_id}</p>}
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end"><Badge tone="brand">Plan aktif: {PLAN_LABELS[effectivePlan]}</Badge>{expiresLabel && <span className="text-xs font-bold text-slate-500">Berlaku: {expiresLabel}</span>}</div>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100"><Globe className="h-5 w-5 text-slate-600" /></div>
            <div>
              <h2 className="font-black text-slate-950">Bahasa / Language / 语言</h2>
              <p className="text-sm text-slate-500">Pilih bahasa antarmuka NEXA Campus</p>
            </div>
          </div>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {settingItems.map(({ title, desc, href, icon: Icon }) => (
          <Card key={title}>
            <CardContent>
              <Icon className="mb-4 h-5 w-5 text-brand-700" />
              <h2 className="font-black text-slate-950">{title}</h2>
              <p className="mt-2 min-h-10 text-sm leading-6 text-slate-600">{desc}</p>
              <Link href={href} className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700">
                Buka
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteAccountDangerZone email={typedProfile.email} />
    </div>
  )
}
