'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Compass, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

type Step = { id: string; label: string; done: boolean; href: string }

type Data = { percent: number; steps: Step[] }

export default function OnboardingCoachCard() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/profile/me', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((profile) => {
        if (!active || !profile) return
        const steps: Step[] = [
          { id: 'avatar', label: 'Pasang foto profil', done: Boolean(profile.avatar_url), href: '/dashboard/settings/profile' },
          { id: 'bio', label: 'Isi bio publik', done: Boolean(profile.profile_bio), href: '/dashboard/settings/profile' },
          { id: 'skills', label: 'Tambah skill', done: Array.isArray(profile.profile_skills) && profile.profile_skills.length > 0, href: '/dashboard/settings/profile' },
          { id: 'badge', label: 'Pilih badge utama', done: Boolean(profile.featured_badge), href: '/dashboard/achievements' },
          { id: 'portfolio', label: 'Tambah portfolio atau GitHub', done: Boolean(profile.portfolio_url || profile.github_url), href: '/dashboard/settings/profile' },
        ]
        setData({ steps, percent: Math.round((steps.filter((s) => s.done).length / steps.length) * 100) })
      })
      .catch(() => null)
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <Card><CardContent className="flex h-32 items-center justify-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>
  if (!data || data.percent >= 100) return null

  return (
    <Card className="border-cyan-100 bg-gradient-to-br from-white to-cyan-50">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700"><Compass className="h-3.5 w-3.5" /> Panduan Profil</div><h2 className="font-black text-slate-950">Profil kamu {data.percent}% lengkap</h2><p className="text-xs text-slate-500">Lengkapi profil supaya teman lain lebih mudah mengenal kamu.</p></div>
          <span className="text-2xl font-black text-cyan-700">{data.percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${data.percent}%` }} /></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.steps.map((step) => <Link key={step.id} href={step.href} className="flex items-center gap-2 rounded-2xl bg-white p-2.5 text-xs font-black text-slate-700 hover:bg-cyan-50">{step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />} {step.label}</Link>)}
        </div>
      </CardContent>
    </Card>
  )
}
