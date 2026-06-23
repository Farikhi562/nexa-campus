'use client'

/**
 * CONTOH wiring daftar Arena memakai ArenaPostCard.
 * Inti: ganti komponen kartu arena lama dengan ArenaPostCard ini — badge inline
 * (creator + anggota tim) otomatis pakai sistem animasi, tidak perlu ubah API.
 *
 * Letakkan / adaptasi di komponen daftar arena milikmu (mis. ArenaList.tsx).
 */

import { useEffect, useState } from 'react'
import { ArenaPostCard, type ArenaPost } from '@/components/arena/ArenaPostCard'

export function ArenaListExample({ currentUserId }: { currentUserId: string | null }) {
  const [posts, setPosts] = useState<ArenaPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/arena')
      if (res.ok) {
        const j = await res.json() as { data: ArenaPost[] }
        setPosts(j.data ?? [])
      }
      setLoading(false)
    })()
  }, [])

  if (loading) return <p className="text-center text-zinc-500 py-8">Memuat…</p>

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {posts.map((post) => (
        <ArenaPostCard
          key={post.id}
          post={post}
          isOwner={post.creator_id === currentUserId}
          onWorkspace={(id) => { location.href = `/arena/${id}/workspace` }}
          onReview={(id) => { location.href = `/arena/${id}/applications` }}
          onEdit={(id) => { location.href = `/arena/${id}/edit` }}
          onDelete={async (id) => {
            if (!confirm('Hapus post ini?')) return
            await fetch(`/api/arena/${id}`, { method: 'DELETE' })
            setPosts((p) => p.filter((x) => x.id !== id))
          }}
          onApply={(id) => { location.href = `/arena/${id}/apply` }}
        />
      ))}
    </div>
  )
}
