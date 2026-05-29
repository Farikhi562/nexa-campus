'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Copy, LockKeyhole, Plus, Search, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProUpgradeModal from '@/components/ProUpgradeModal'
import { createClient } from '@/lib/supabase/client'
import { hasProAccess } from '@/lib/plans'
import type { Profile } from '@/types'

type Team = {
  id: string
  name: string
  description: string | null
  invite_code: string
  creator_id: string
}

export default function TeamsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)

  const fetchTeams = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, memberRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('team_members').select('study_teams(*)').eq('user_id', user.id).order('joined_at', { ascending: false }),
    ])

    if (profileRes.data) setProfile(profileRes.data as Profile)
    const rows = (memberRes.data || []) as Array<{ study_teams: Team | Team[] | null }>
    setTeams(rows.flatMap((row) => Array.isArray(row.study_teams) ? row.study_teams : row.study_teams ? [row.study_teams] : []))
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  async function createTeam() {
    if (!hasProAccess(profile)) {
      setLocked(true)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !name.trim() || saving) return
    setSaving(true)

    const { data: team, error } = await supabase.from('study_teams').insert({
      name: name.trim(),
      description: description.trim() || null,
      creator_id: user.id,
    }).select().single()

    if (error || !team) {
      alert(error?.message || 'Gagal membuat tim.')
      setSaving(false)
      return
    }

    await supabase.from('team_members').insert({ team_id: team.id, user_id: user.id, role: 'owner' })
    setName('')
    setDescription('')
    setSaving(false)
    fetchTeams()
  }

  async function joinTeam() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !inviteCode.trim()) return

    const { data: team } = await supabase.from('study_teams').select('id').eq('invite_code', inviteCode.trim()).single()
    if (!team) {
      alert('Kode invite tidak ditemukan.')
      return
    }

    const { error } = await supabase.from('team_members').upsert({ team_id: team.id, user_id: user.id }, { onConflict: 'team_id,user_id' })
    if (error) alert(error.message)
    setInviteCode('')
    fetchTeams()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-600">Tim Belajar Permanen</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Library, leaderboard, dan chat grup.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Pro bisa membuat tim. Free dan Basic tetap bisa masuk lewat invite.</p>
          </div>
          {!hasProAccess(profile) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <LockKeyhole className="mr-2 inline h-4 w-4" />
              Buat tim khusus Pro
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-600" />
              <h2 className="font-black text-slate-950">Buat tim</h2>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama tim" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500" />
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Deskripsi singkat" rows={3} className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500" />
              <Button fullWidth loading={saving} disabled={!name.trim()} onClick={createTeam}>Buat Tim</Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-brand-600" />
              <h2 className="font-black text-slate-950">Gabung via kode</h2>
            </div>
            <div className="flex gap-2">
              <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Kode invite" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-brand-500" />
              <Button onClick={joinTeam}>Gabung</Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-black text-slate-950">Tim kamu</h2>
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">Memuat tim...</div>
          ) : teams.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-bold text-slate-700">Belum ikut tim mana pun.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {teams.map((team) => (
                <Link key={team.id} href={`/tim/${team.id}`} className="rounded-lg border border-slate-200 p-4 transition hover:border-brand-300 hover:shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-950">{team.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{team.description || 'Tim belajar NEXA'}</p>
                    </div>
                    <Users className="h-5 w-5 text-brand-600" />
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      navigator.clipboard.writeText(team.invite_code)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {team.invite_code}
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <ProUpgradeModal open={locked} feature="Membuat Tim Belajar" onClose={() => setLocked(false)} />
    </div>
  )
}
