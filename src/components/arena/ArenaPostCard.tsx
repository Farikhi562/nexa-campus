'use client'

/**
 * Kartu post di NEXA Arena — versi yang sudah memakai sistem badge animasi.
 *
 * Mengganti "medali gradient + emoji" lama di samping nama (creator & anggota tim)
 * dengan <InlineBadge> yang sumbernya sama persis dengan halaman Pencapaian.
 *
 * Bentuk data = persis response GET /api/arena (lihat ArenaPost di bawah).
 * Tidak ada perubahan API: badgeId diambil dari creator_featured_badge &
 * team_members[].profile.featured_badge yang sudah dikirim route.
 */

import { Clock, Eye, Pencil, Trash2, Users } from 'lucide-react'
import { InlineBadge } from '@/components/badges'

// ─── Tipe (mirror response /api/arena) ───────────────────────────────────────

export interface ArenaMemberProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  nexa_id: string | null
  featured_badge: string | null
  is_nexa_verified: boolean | null
}

export interface ArenaTeamMember {
  post_id: string
  user_id: string
  role: string
  joined_at: string
  profile: ArenaMemberProfile | null
}

export interface ArenaPost {
  id: string
  creator_id: string
  title: string
  competition_name: string | null
  competition_type: string
  description: string | null
  skills_needed: string[]
  team_size_max: number
  deadline_registration: string | null
  event_date: string | null
  prize: string | null
  status?: string | null
  // enrichment dari route:
  creator_name: string | null
  creator_featured_badge: string | null
  has_applied: boolean
  my_application_status: string | null
  applications_count: number
  pending_applications_count: number
  team_members: ArenaTeamMember[]
  matching_skills?: string[]
  match_score?: number
}

interface Props {
  post: ArenaPost
  /** apakah user saat ini adalah pembuat post (tampilkan tombol kelola) */
  isOwner: boolean
  onWorkspace?: (postId: string) => void
  onReview?: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  onApply?: (postId: string) => void
}

// ─── Helper tampilan ──────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; emoji: string }> = {
  hackathon: { label: 'Hackathon', emoji: '💻' },
  bisnis:    { label: 'Bisnis',    emoji: '📊' },
  saintek:   { label: 'Saintek',   emoji: '🔬' },
  desain:    { label: 'Desain',    emoji: '🎨' },
  akademik:  { label: 'Akademik',  emoji: '📚' },
  seni:      { label: 'Seni',      emoji: '🎭' },
  esport:    { label: 'Esport',    emoji: '🎮' },
  olahraga:  { label: 'Olahraga',  emoji: '⚽' },
  lainnya:   { label: 'Lainnya',   emoji: '✨' },
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

const isOpen = (status?: string | null) => !status || status === 'open' || status === 'buka'

// ─── Sub-komponen: baris anggota tim ──────────────────────────────────────────

function MemberRow({ member }: { member: ArenaTeamMember }) {
  const p = member.profile
  const name = p?.full_name ?? 'User'
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-zinc-200 px-3 py-2.5">
      {p?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <span className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-500 text-xs font-bold flex items-center justify-center shrink-0">
          {initials(name)}
        </span>
      )}
      <span className="flex-1 min-w-0 truncate text-[15px] font-semibold text-zinc-800">{name}</span>
      <InlineBadge badgeId={p?.featured_badge} size="sm" />
    </div>
  )
}

// ─── Komponen utama ───────────────────────────────────────────────────────────

export function ArenaPostCard({ post, isOwner, onWorkspace, onReview, onEdit, onDelete, onApply }: Props) {
  const typeMeta = TYPE_META[post.competition_type] ?? TYPE_META.lainnya
  const memberCount = post.team_members.length
  const deadline = formatDate(post.deadline_registration ?? post.event_date)
  const open = isOpen(post.status)

  return (
    <div className="rounded-3xl bg-white border border-zinc-200/80 shadow-sm p-5 space-y-4">
      {/* Status + kategori */}
      <div className="flex items-center gap-2.5">
        <span className="text-2xl leading-none">{typeMeta.emoji}</span>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${open ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
          {open ? 'Buka' : 'Tutup'}
        </span>
        <span className="rounded-full bg-zinc-100 text-zinc-600 px-3 py-1 text-sm font-medium">{typeMeta.label}</span>
      </div>

      {/* Judul + nama kompetisi */}
      <div className="space-y-1">
        <h3 className="text-2xl font-extrabold text-zinc-900 leading-tight">{post.title}</h3>
        {post.competition_name && (
          <p className="text-base font-semibold text-teal-600">{post.competition_name}</p>
        )}
      </div>

      {/* Meta: anggota + tanggal */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-zinc-600">
          <Users size={18} className="text-zinc-400" />
          <span className="font-semibold">{memberCount}/{post.team_size_max}</span> anggota
        </span>
        {deadline && (
          <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">
            <Clock size={15} className="text-zinc-400" />
            <span className="font-semibold">{deadline}</span>
          </span>
        )}
      </div>

      {/* oleh <creator> <badge> */}
      <div className="flex items-center gap-2 flex-wrap text-zinc-500">
        <span>oleh</span>
        <span className="font-bold text-zinc-800">{post.creator_name ?? 'User'}</span>
        <InlineBadge badgeId={post.creator_featured_badge} size="xs" />
      </div>

      {/* TIM APPROVED */}
      {memberCount > 0 && (
        <div className="rounded-3xl bg-emerald-50/70 border border-emerald-100 p-3.5 space-y-2.5">
          <p className="text-sm font-extrabold tracking-wide text-emerald-700 uppercase">Tim Approved</p>
          <div className="space-y-2">
            {post.team_members.map((m) => <MemberRow key={m.user_id} member={m} />)}
          </div>
        </div>
      )}

      {/* Aksi */}
      {isOwner ? (
        <div className="space-y-2.5">
          <button onClick={() => onWorkspace?.(post.id)} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-bold py-3.5 transition-colors hover:bg-amber-100">
            <Users size={18} /> Team Workspace
          </button>
          <button onClick={() => onReview?.(post.id)} className="relative w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-bold py-3.5 transition-colors hover:bg-amber-100">
            <Eye size={18} /> Review pelamar
            {post.pending_applications_count > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                {post.pending_applications_count}
              </span>
            )}
          </button>
          <div className="flex gap-2.5">
            <button onClick={() => onEdit?.(post.id)} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white border border-zinc-200 text-zinc-700 font-bold py-3.5 transition-colors hover:bg-zinc-50">
              <Pencil size={16} /> Edit
            </button>
            <button onClick={() => onDelete?.(post.id)} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 font-bold py-3.5 transition-colors hover:bg-rose-100">
              <Trash2 size={16} /> Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onApply?.(post.id)}
          disabled={post.has_applied || !open || memberCount >= post.team_size_max}
          className="w-full rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 transition-colors"
        >
          {post.has_applied
            ? `Lamaran: ${post.my_application_status ?? 'terkirim'}`
            : memberCount >= post.team_size_max ? 'Tim penuh'
            : !open ? 'Pendaftaran ditutup'
            : 'Gabung tim'}
        </button>
      )}
    </div>
  )
}
