import Link from 'next/link'
import { ArrowLeft, ExternalLink, Lock, MessageCircle, Radio, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { BadgeChip, BadgeTierLabel, FeaturedBadgePin } from '@/components/BadgeChip'
import FounderVerifiedBadge from '@/components/FounderVerifiedBadge'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { BADGES, type BadgeDef } from '@/lib/badges'
import type { Plan } from '@/types'

type Visibility = 'public' | 'private' | null

type ViewProfile = {
  id: string
  email?: string | null
  founder_verified?: boolean | null
  full_name: string | null
  campus_name: string | null
  province: string | null
  major: string | null
  semester: number | null
  avatar_url: string | null
  plan: Plan
  nexa_id: string | null
  is_public_profile: boolean | null
  featured_badge: string | null
  badges: string[] | null
  public_profile_headline: string | null
  profile_bio: string | null
  profile_bio_visibility: Visibility
  profile_skills: string[] | null
  profile_skills_visibility: Visibility
  profile_interests: string[] | null
  profile_interests_visibility: Visibility
  portfolio_url: string | null
  github_url: string | null
  linkedin_url: string | null
  online_status_visibility?: 'public' | 'friends' | 'private' | null
  study_room_presence_visibility?: 'members' | 'private' | null
  dm_privacy?: 'friends' | 'none' | null
  created_at: string
}

function initials(name?: string | null) {
  if (!name) return 'N'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'N'
}

function planBadge(plan: Plan) {
  if (plan === 'command') return 'badge_command'
  if (plan === 'pulse') return 'badge_pulse'
  return 'badge_radar'
}

function collectBadges(profile: ViewProfile): BadgeDef[] {
  const ids = new Set<string>()
  ids.add(planBadge(profile.plan))
  if (profile.featured_badge) ids.add(profile.featured_badge)
  for (const id of profile.badges ?? []) ids.add(id)
  return BADGES.filter((badge) => ids.has(badge.id))
}

function canShow(isOwnProfile: boolean, visibility: Visibility) {
  return isOwnProfile || visibility !== 'private'
}

function cleanList(values?: string[] | null) {
  return Array.isArray(values) ? values.map((value) => value.trim()).filter(Boolean) : []
}

function ExternalProfileLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-teal-200 hover:text-teal-700">
      <ExternalLink className="h-3.5 w-3.5" /> {label}
    </a>
  )
}

export default function PublicUserProfileView({ profile, isOwnProfile, canMessage = false }: { profile: ViewProfile; isOwnProfile: boolean; canMessage?: boolean }) {
  const isPublic = profile.is_public_profile ?? true
  const badges = collectBadges(profile)
  const showBio = canShow(isOwnProfile, profile.profile_bio_visibility)
  const showSkills = canShow(isOwnProfile, profile.profile_skills_visibility)
  const showInterests = canShow(isOwnProfile, profile.profile_interests_visibility)
  const skills = showSkills ? cleanList(profile.profile_skills) : []
  const interests = showInterests ? cleanList(profile.profile_interests) : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard/friends" className="focus-ring inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="flex items-center gap-2">
          {canMessage && (
            <Link href={`/dashboard/messages/${profile.id}`} className="focus-ring inline-flex items-center gap-1.5 rounded-2xl bg-teal-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-teal-300">
              <MessageCircle className="h-3.5 w-3.5" /> Chat
            </Link>
          )}
          {isOwnProfile && (
            <Link href="/dashboard/settings/profile" className="focus-ring rounded-2xl bg-teal-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-teal-300">
              Edit Profil
            </Link>
          )}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.28),transparent_18rem),radial-gradient(circle_at_10%_90%,rgba(251,191,36,0.16),transparent_16rem)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 text-3xl font-black text-white shadow-2xl sm:h-28 sm:w-28">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="Foto profil" className="h-full w-full object-cover" />
            ) : (
              initials(profile.full_name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={profile.plan === 'command' ? 'warning' : profile.plan === 'pulse' ? 'brand' : 'neutral'}>
                {profile.plan.toUpperCase()}
              </Badge>
              {!isPublic && <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-slate-200"><Lock className="h-3 w-3" /> Profil privat</span>}
              {profile.featured_badge && <FeaturedBadgePin badgeId={profile.featured_badge} />}
              {profile.online_status_visibility !== 'private' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-black text-emerald-100"><Radio className="h-3 w-3" /> Bisa tampil online</span>
              )}
            </div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl"><span>{profile.full_name ?? 'Mahasiswa NEXA'}</span><FounderVerifiedBadge founderVerified={profile.founder_verified} email={profile.email} /></h1>
            {profile.public_profile_headline && <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-teal-100">{profile.public_profile_headline}</p>}
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {[profile.campus_name, profile.major, profile.semester ? `Semester ${profile.semester}` : null].filter(Boolean).join(' · ') || 'Profil akademik belum lengkap'}
            </p>
            {profile.nexa_id && <p className="mt-1 text-xs font-black text-slate-400">NEXA ID #{profile.nexa_id}</p>}
          </div>
        </div>
      </section>

      {!isPublic && !isOwnProfile ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h2 className="text-lg font-black text-slate-950">Profil ini privat.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">User ini memilih buat nggak menampilkan detail publik. Pilihan yang waras, mengingat internet kadang seperti pasar malam tanpa satpam.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500"><UserRound className="h-4 w-4" /> Deskripsi</h2>
                  {isOwnProfile && profile.profile_bio_visibility === 'private' && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">Privat</span>}
                </div>
                {showBio && profile.profile_bio ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{profile.profile_bio}</p>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">Deskripsi belum ditulis atau disetel privat.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500"><Sparkles className="h-4 w-4" /> Skill</h2>
                  {isOwnProfile && profile.profile_skills_visibility === 'private' && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">Privat</span>}
                </div>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => <span key={skill} className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-700 ring-1 ring-teal-100">{skill}</span>)}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">Skill belum ditampilkan.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Minat belajar</h2>
                  {isOwnProfile && profile.profile_interests_visibility === 'private' && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">Privat</span>}
                </div>
                {interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => <span key={interest} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{interest}</span>)}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">Minat belum ditampilkan.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500"><ShieldCheck className="h-4 w-4" /> Badge</h2>
                {badges.length > 0 ? (
                  <div className="space-y-3">
                    {badges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <BadgeChip badge={badge} size="md" selected={badge.id === profile.featured_badge} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-black text-slate-950">{badge.name}</p>
                            <BadgeTierLabel tier={badge.tier} />
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-500">{badge.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">Belum ada badge publik.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Link publik</h2>
                <div className="flex flex-wrap gap-2">
                  <ExternalProfileLink href={profile.portfolio_url} label="Portfolio" />
                  <ExternalProfileLink href={profile.github_url} label="GitHub" />
                  <ExternalProfileLink href={profile.linkedin_url} label="LinkedIn" />
                </div>
                {!profile.portfolio_url && !profile.github_url && !profile.linkedin_url && <p className="text-sm leading-6 text-slate-500">Belum ada link publik.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
