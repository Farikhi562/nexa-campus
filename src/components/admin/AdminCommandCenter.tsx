'use client'

import { useState } from 'react'
import {
  Activity, AlertCircle, BookOpen, CheckCircle2, CreditCard, Gift,
  Heart, Search, ShieldCheck, Users, XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import SubscriptionIntentActions from '@/components/admin/SubscriptionIntentActions'
import type { Profile, Referral, SubscriptionIntent } from '@/types'
import { PLAN_LABELS } from '@/lib/nexa-data'

type StudyRoomRow = {
  id: string; title: string; status: string; current_members_count: number
  max_members: number; category: string; owner_id: string; created_at: string
}

type FriendRequestRow = {
  id: string; requester_id: string; receiver_id: string; status: string; created_at: string
}

type HealthItem = { label: string; key: string; configured: boolean; note?: string }

type Props = {
  profiles: Profile[]
  intents: SubscriptionIntent[]
  referrals: Referral[]
  studyRooms: StudyRoomRow[]
  friendRequests: FriendRequestRow[]
  nameById: Record<string, string>
  systemHealth: HealthItem[]
  stats: { totalUsers: number; pendingIntents: number; rewardedReferrals: number; commandUsers: number; activeRooms: number }
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'intents', label: 'Upgrade Intents', icon: CreditCard },
  { id: 'rooms', label: 'Study Rooms', icon: BookOpen },
  { id: 'referrals', label: 'Referral', icon: Gift },
  { id: 'friends', label: 'Friend Requests', icon: Heart },
  { id: 'health', label: 'System Health', icon: ShieldCheck },
] as const

type TabId = (typeof TABS)[number]['id']

function UserAvatar({ profile }: { profile: Profile }) {
  const init = (profile.full_name || profile.email || 'N').slice(0, 1).toUpperCase()
  return (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        : init}
    </span>
  )
}

function PlanBadge({ plan }: { plan: Profile['plan'] }) {
  const tone = plan === 'command' ? 'brand' : plan === 'pulse' ? 'info' : 'neutral'
  return <Badge tone={tone}>{PLAN_LABELS[plan] ?? plan}</Badge>
}

function statusTone(status: SubscriptionIntent['status']) {
  if (status === 'confirmed') return 'success' as const
  if (status === 'rejected' || status === 'cancelled') return 'danger' as const
  return 'warning' as const
}

export default function AdminCommandCenter({
  profiles, intents, referrals, studyRooms, friendRequests, nameById, systemHealth, stats,
}: Props) {
  const [tab, setTab] = useState<TabId>('overview')
  const [userSearch, setUserSearch] = useState('')

  const filteredProfiles = userSearch.trim()
    ? profiles.filter((p) =>
        (p.full_name ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (p.email ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (p.campus_name ?? '').toLowerCase().includes(userSearch.toLowerCase())
      )
    : profiles

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition sm:text-sm ${
              tab === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              { label: 'Total users', value: stats.totalUsers, icon: Users },
              { label: 'Pending upgrades', value: stats.pendingIntents, icon: CreditCard },
              { label: 'Rewarded referrals', value: stats.rewardedReferrals, icon: Gift },
              { label: 'Command users', value: stats.commandUsers, icon: ShieldCheck },
              { label: 'Active rooms', value: stats.activeRooms, icon: BookOpen },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-2xl font-black text-slate-950">{value}</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-500">{label}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-teal-200">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardContent className="p-0">
                <p className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-950">Users terbaru</p>
                <div className="divide-y divide-slate-100">
                  {profiles.slice(0, 8).map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar profile={p} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{p.full_name || p.email}</p>
                          <p className="truncate text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                      <PlanBadge plan={p.plan} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <p className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-950">Upgrade intent terbaru</p>
                <div className="divide-y divide-slate-100">
                  {intents.slice(0, 8).map((intent) => (
                    <div key={intent.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{PLAN_LABELS[intent.requested_plan] ?? intent.requested_plan}</p>
                        <p className="truncate text-xs text-slate-500">{nameById[intent.user_id] ?? intent.user_id.slice(0,8)}</p>
                      </div>
                      <Badge tone={statusTone(intent.status)}>{intent.status}</Badge>
                    </div>
                  ))}
                  {intents.length === 0 && <p className="p-4 text-sm text-slate-500">Belum ada intent.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama, email, atau kampus..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm"
                />
              </div>
              <span className="text-sm text-slate-500">{filteredProfiles.length} user</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredProfiles.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar profile={p} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{p.full_name || 'Belum diisi'}</p>
                      <p className="truncate text-xs text-slate-500">{p.email}</p>
                      <p className="truncate text-xs text-slate-400">{[p.campus_name, p.major].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PlanBadge plan={p.plan} />
                    <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* UPGRADE INTENTS */}
      {tab === 'intents' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {intents.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Belum ada upgrade intent.</p>}
              {intents.map((intent) => (
                <div key={intent.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-950">{PLAN_LABELS[intent.requested_plan] ?? intent.requested_plan}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{nameById[intent.user_id] ?? intent.user_id.slice(0,8)} · {intent.payment_method}</p>
                      {intent.contact_note && <p className="mt-1 text-xs italic text-slate-400">{intent.contact_note}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={statusTone(intent.status)}>{intent.status}</Badge>
                      <SubscriptionIntentActions intentId={intent.id} disabled={intent.status !== 'pending'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STUDY ROOMS */}
      {tab === 'rooms' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {studyRooms.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Belum ada study room.</p>}
              {studyRooms.map((room) => (
                <div key={room.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">{room.title}</p>
                    <p className="text-xs text-slate-500">
                      {room.category} · {room.current_members_count}/{room.max_members} anggota ·
                      Owner: {nameById[room.owner_id] ?? room.owner_id.slice(0,8)}
                    </p>
                  </div>
                  <Badge tone={room.status === 'open' ? 'success' : room.status === 'full' ? 'warning' : 'neutral'}>
                    {room.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* REFERRALS */}
      {tab === 'referrals' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {referrals.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Belum ada referral yang tercatat. Pastikan tabel referrals & SUPABASE_SERVICE_ROLE_KEY sudah diset.</p>}
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between gap-3 p-4 sm:p-5">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {nameById[ref.referrer_id] ?? ref.referrer_id.slice(0,8)}
                      <span className="mx-2 text-slate-400">→</span>
                      {nameById[ref.referred_id] ?? ref.referred_id.slice(0,8)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{new Date(ref.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <Badge tone={ref.rewarded ? 'success' : 'warning'}>{ref.rewarded ? 'Rewarded' : 'Pending'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FRIENDS */}
      {tab === 'friends' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {friendRequests.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Belum ada friend request yang tercatat.</p>}
              {friendRequests.map((req) => (
                <div key={req.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-950">
                      {nameById[req.requester_id] ?? req.requester_id.slice(0,8)}
                      <span className="mx-2 text-slate-400">→</span>
                      {nameById[req.receiver_id] ?? req.receiver_id.slice(0,8)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <Badge tone={req.status === 'accepted' ? 'success' : req.status === 'rejected' ? 'neutral' : 'warning'}>
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SYSTEM HEALTH */}
      {tab === 'health' && (
        <div className="space-y-3">
          <Card>
            <CardContent className="p-0">
              <p className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-950">Environment Variables</p>
              <div className="divide-y divide-slate-100">
                {systemHealth.map(({ label, configured, note }) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{label}</p>
                      {note && <p className="text-xs text-slate-500">{note}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                      configured ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {configured
                        ? <><CheckCircle2 className="h-3.5 w-3.5" /> Configured</>
                        : <><XCircle className="h-3.5 w-3.5" /> Not configured</>}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">Secret key values tidak pernah ditampilkan di sini. Hanya status &quot;configured/not configured&quot; yang aman untuk ditampilkan.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
