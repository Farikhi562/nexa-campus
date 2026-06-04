'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import type { Profile } from '@/types'

export default function OnboardingForm({
  profile,
  referralCode,
}: {
  profile: Partial<Profile>
  referralCode?: string
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const payload = {
      id: profile.id,
      email: profile.email,
      full_name: String(form.get('full_name') || '').trim(),
      campus_name: String(form.get('campus_name') || '').trim(),
      major: String(form.get('major') || '').trim(),
      semester: Number(form.get('semester') || 1),
      province: String(form.get('province') || '').trim() || null,
      gender: String(form.get('gender') || '').trim() || null,
      avatar_icon: null,
      student_id: String(form.get('student_id') || '').trim() || null,
      phone_number: String(form.get('phone_number') || '').trim() || null,
      telegram_chat_id: String(form.get('telegram_chat_id') || '').trim() || null,
      whatsapp_number: String(form.get('whatsapp_number') || '').trim() || null,
      plan: profile.plan ?? 'radar',
      profile_completed: true,
    }

    const { error: upsertError } = await supabase.from('profiles').upsert(payload)
    setLoading(false)

    if (upsertError) {
      setError(upsertError.message)
      return
    }

    const storedReferralCode =
      referralCode ||
      (typeof window !== 'undefined' ? window.sessionStorage.getItem('nexa_referral_code') || '' : '')

    if (storedReferralCode) {
      await fetch('/api/referrals/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: storedReferralCode }),
      }).catch(() => null)
      window.sessionStorage.removeItem('nexa_referral_code')
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <p className="text-sm font-black text-brand-800">Step 1 · Confirm profile</p>
        <p className="mt-1 text-xs leading-5 text-brand-700">
          Data minimum dulu: nama, kampus, jurusan, dan semester.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Nama lengkap</span>
          <input name="full_name" defaultValue={profile.full_name ?? ''} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Kampus</span>
          <input name="campus_name" defaultValue={profile.campus_name ?? ''} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Provinsi opsional</span>
          <input name="province" defaultValue={profile.province ?? ''} placeholder="Contoh: Jawa Barat" className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Jurusan</span>
          <select name="major" defaultValue={profile.major ?? ''} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            <option value="">Pilih jurusan</option>
            {[
              'Akuntansi',
              'Arsitektur',
              'Bisnis Digital',
              'Desain Komunikasi Visual',
              'Hukum',
              'Ilmu Komunikasi',
              'Ilmu Komputer',
              'Manajemen',
              'Psikologi',
              'Sistem Informasi',
              'Teknik Industri',
              'Teknik Informatika',
              'Teknik Mesin',
              'Teknik Sipil',
              'Lainnya',
            ].map((major) => <option key={major} value={major}>{major}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Semester</span>
          <input name="semester" type="number" min="1" max="14" defaultValue={profile.semester ?? 1} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">NPM / student ID opsional</span>
          <input name="student_id" defaultValue={profile.student_id ?? ''} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Telegram chat ID opsional</span>
          <input name="telegram_chat_id" defaultValue={profile.telegram_chat_id ?? ''} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Nomor HP opsional</span>
          <input name="phone_number" defaultValue={profile.phone_number ?? ''} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">WhatsApp opsional</span>
          <input name="whatsapp_number" defaultValue={profile.whatsapp_number ?? ''} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Gender opsional</span>
          <select name="gender" defaultValue={profile.gender ?? ''} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            <option value="">Tidak diisi</option>
            <option value="laki_laki">Laki-laki</option>
            <option value="perempuan">Perempuan</option>
            <option value="lainnya">Lainnya</option>
            <option value="tidak_ingin_menyebutkan">Tidak ingin menyebutkan</option>
          </select>
        </label>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-950">Step 2 · Reminder preference</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Telegram bisa diisi untuk testing. WhatsApp masih roadmap/coming soon, jadi opsional dulu.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-950">Step 3 · Add first deadline</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Setelah onboarding, kamu bisa langsung tambah deadline pertama dari dashboard. Password kampus tetap nggak diminta.
        </p>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Masuk Dashboard'}</Button>
    </form>
  )
}
