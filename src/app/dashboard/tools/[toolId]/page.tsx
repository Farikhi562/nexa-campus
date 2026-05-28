'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock3, Lock, Sparkles, Wand2, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import { PlanBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import {
  CAMPUS_TOOLS,
  FREE_DAILY_LIMIT,
  accessClass,
  buildToolResult,
  getCampusTool,
  statusClass,
} from '@/lib/campus-tools'
import type { Plan, Profile } from '@/types'

export default function CampusToolDetailPage() {
  const params = useParams<{ toolId: string }>()
  const supabase = useMemo(() => createClient(), [])
  const tool = getCampusTool(params.toolId) ?? CAMPUS_TOOLS[0]

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [freeUses, setFreeUses] = useState(0)
  const [input, setInput] = useState(tool.prompt)
  const [result, setResult] = useState<string[]>([])

  useEffect(() => {
    setInput(tool.prompt)
    setResult([])
    setFreeUses(0)
  }, [tool])

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data as Profile)
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  const plan = (profile?.plan ?? 'free') as Plan
  const isPaid = plan !== 'free'
  const isLocked = !isPaid && tool.access === 'paid'
  const freeLimitReached = !isPaid && tool.access === 'free' && freeUses >= FREE_DAILY_LIMIT
  const canRun = !isLocked && !freeLimitReached
  const Icon = tool.icon

  function runTool() {
    if (!canRun) return
    setRunning(true)
    window.setTimeout(() => {
      if (!isPaid && tool.access === 'free') setFreeUses((current) => current + 1)
      setResult(buildToolResult(tool, input))
      setRunning(false)
    }, 450)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/tools" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke katalog tools
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg ${isLocked ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'}`}>
              {isLocked ? <Lock className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
            </div>
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${accessClass(tool.access)}`}>
                  {tool.access === 'free' ? 'Gratis terbatas' : 'Premium'}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${statusClass(tool.status)}`}>
                  {tool.status}
                </span>
                <PlanBadge plan={plan} />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{tool.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">{tool.desc}</p>
            </div>
          </div>

          {!isPaid && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
              <p className="font-black text-red-950">
                {isLocked ? 'Premium terkunci' : `${Math.max(0, FREE_DAILY_LIMIT - freeUses)} demo gratis tersisa`}
              </p>
              <p className="mt-1 text-xs leading-5 text-red-800">Upgrade via DOKU untuk buka semua tools tanpa limit demo.</p>
            </div>
          )}
        </div>
      </section>

      {isLocked && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-red-700">Akses free berhenti di preview</p>
                <h2 className="mt-1 text-xl font-black text-red-950">Tool ini bisa menghemat waktu saat deadline mepet.</h2>
                <p className="mt-1 text-sm leading-6 text-red-800">{tool.fomo}</p>
              </div>
            </div>
            <Link href="/pricing">
              <Button type="button" className="bg-red-600 hover:bg-red-700">
                <Zap className="h-4 w-4" />
                Upgrade via DOKU
              </Button>
            </Link>
          </div>
        </section>
      )}

      {freeLimitReached && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          Kuota demo gratis habis. Upgrade via DOKU untuk memakai semua Campus Tools tanpa batas demo.
        </section>
      )}

      <section className="relative grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        {isLocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-red-200 bg-white/55 p-6 backdrop-blur-[2px]">
            <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-red-950">Workspace premium terkunci</h3>
              <p className="mt-2 text-sm leading-6 text-red-800">Basic/Pro membuka halaman ini penuh. Pembayaran diarahkan ke DOKU.</p>
              <Link href="/pricing" className="mt-4 inline-flex">
                <Button type="button" className="bg-red-600 hover:bg-red-700">Buka Paket</Button>
              </Link>
            </div>
          </div>
        )}

        <div className={`rounded-lg border border-slate-200 bg-white p-5 ${isLocked ? 'blur-[2px]' : ''}`}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
            <Wand2 className="h-5 w-5 text-brand-600" />
            Workspace
          </h3>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Input tool</label>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLocked}
            className="mt-2 min-h-48 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">{tool.output}</p>
            <Button type="button" onClick={runTool} disabled={!canRun || running} loading={running}>
              <Sparkles className="h-4 w-4" />
              Jalankan Tool
            </Button>
          </div>
        </div>

        <div className={`rounded-lg border border-slate-200 bg-white p-5 ${isLocked ? 'blur-[2px]' : ''}`}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Output
          </h3>
          <div className="space-y-3">
            {result.length > 0 ? (
              result.map((item) => (
                <p key={item} className="flex gap-2 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  {item}
                </p>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                Klik <span className="font-bold text-slate-700">Jalankan Tool</span> untuk memproses input dan melihat hasil di sini.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
