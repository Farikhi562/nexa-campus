'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Radio, MessageCircle } from 'lucide-react'
import { FeaturedBadgePin } from '@/components/BadgeChip'
import FounderVerifiedBadge from '@/components/FounderVerifiedBadge'
import type { PublicProfile } from '@/types'
import Image from 'next/image'

export default function OnlineFriendsStrip() {
  const [friends, setFriends] = useState<PublicProfile[]>([])

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch('/api/presence/friends', { cache: 'no-store' })
        const json = await res.json()
        if (alive && res.ok) setFriends(json.data ?? [])
      } catch {}
    }
    void load()
    const interval = window.setInterval(() => void load(), 60_000)
    return () => { alive = false; window.clearInterval(interval) }
  }, [])

  return (
    <section className="rounded-3xl border border-teal-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-slate-950"><Radio className="h-4 w-4 text-emerald-500" /> Teman online</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Status online hanya terlihat jika teman mengizinkannya lewat pengaturan privasi.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{friends.length} online</span>
      </div>
      {friends.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Belum ada teman yang online atau mereka memilih disembunyikan. Tidak semua orang ingin terlihat hidup di internet, masuk akal juga.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {friends.slice(0, 10).map((friend) => (
            <Link key={friend.id} href={`/dashboard/messages/${friend.id}`} className="group flex min-w-[180px] items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 transition hover:border-teal-200 hover:bg-teal-50">
              <span className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-200 text-xs font-black text-slate-600">
                {friend.avatar_url ? <Image src={friend.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" /> : (friend.full_name ?? 'N').slice(0, 1).toUpperCase()}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-black text-slate-950 group-hover:text-teal-700">{friend.full_name ?? 'Teman NEXA'}</span>
                  <FounderVerifiedBadge founderVerified={friend.founder_verified} email={friend.email} compact />
                  <FeaturedBadgePin badgeId={friend.featured_badge} />
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-500"><MessageCircle className="h-3 w-3" /> Chat pribadi</span>
                {friend.nexa_id && <span className="mt-0.5 block text-[10px] font-black text-slate-400">#{friend.nexa_id}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
