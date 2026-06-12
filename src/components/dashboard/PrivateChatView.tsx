'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit2, FileText, Loader2, Paperclip, Send, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { FeaturedBadgePin } from '@/components/BadgeChip'
import FounderVerifiedBadge from '@/components/FounderVerifiedBadge'
import type { PrivateMessage, PublicProfile } from '@/types'

const QUICK_REPLIES = ['Sip', 'Gas', 'Oke', 'Done', 'Haha', 'Mantap']

function formatBytes(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function avatarText(name?: string | null) {
  return (name ?? 'N').slice(0, 1).toUpperCase()
}

function mediaUrl(path?: string | null) {
  if (!path) return ''
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/private-chat-attachments/${path}`
}

export default function PrivateChatView({ friendId, userId }: { friendId: string; userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [friend, setFriend] = useState<PublicProfile | null>(null)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setError('')
    const res = await fetch(`/api/chats/${friendId}/messages`, { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(json.error ?? 'Chat gagal dibuka.')
      setLoading(false)
      return
    }
    setFriend(json.friend ?? null)
    setMessages(json.data ?? [])
    setLoading(false)
  }, [friendId])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const channel = supabase
      .channel(`private-chat-${[userId, friendId].sort().join('-')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages' }, (payload) => {
        const row = (payload.new || payload.old) as PrivateMessage | undefined
        if (!row) return
        const involved =
          (row.sender_id === userId && row.receiver_id === friendId) ||
          (row.sender_id === friendId && row.receiver_id === userId)
        if (!involved) return

        if (payload.eventType === 'INSERT') {
          setMessages((prev) => prev.find((m) => m.id === row.id) ? prev : [...prev, row])
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map((m) => m.id === row.id ? { ...m, ...row } : m))
        } else if (payload.eventType === 'DELETE') {
          setMessages((prev) => prev.filter((m) => m.id !== row.id))
        }
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [friendId, supabase, userId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  async function sendMessage() {
    if (!message.trim() || sending) return
    const text = message.trim()
    setSending(true)
    setMessage('')

    const res = await fetch(`/api/chats/${friendId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, message_type: 'text' }),
    })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setMessage(text)
      alert(json.error ?? 'Gagal kirim pesan.')
    } else if (json.data) {
      setMessages((prev) => prev.find((m) => m.id === json.data.id) ? prev : [...prev, json.data])
    }
    setSending(false)
  }

  async function sendFile(file: File) {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const upRes = await fetch(`/api/chats/${friendId}/upload`, { method: 'POST', body: formData })
    const upJson = await upRes.json().catch(() => ({}))
    if (!upRes.ok) {
      alert(upJson.error ?? 'Gagal upload file.')
      setUploading(false)
      return
    }

    const att = upJson.data
    const res = await fetch(`/api/chats/${friendId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: att.filename,
        message_type: att.message_type,
        attachment_path: att.path,
        attachment_name: att.filename,
        attachment_size: att.file_size,
        attachment_mime: att.mime_type,
      }),
    })
    const json = await res.json().catch(() => ({}))

    if (res.ok && json.data) setMessages((prev) => [...prev, json.data])
    else alert(json.error ?? 'Gagal kirim file.')
    setUploading(false)
  }

  async function saveEdit() {
    if (!editingId || !editingText.trim()) return
    const activeEditId = editingId
    const res = await fetch(`/api/chats/messages/${activeEditId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editingText.trim() }),
    })
    const json = await res.json().catch(() => ({}))

    if (res.ok && json.data) {
      setMessages((prev) => prev.map((m) => m.id === activeEditId ? { ...m, ...json.data } : m))
      setEditingId(null)
      setEditingText('')
      void load()
    } else {
      alert(json.error ?? 'Gagal edit pesan.')
    }
  }

  async function deleteMessage(messageId: string) {
    if (!confirm('Hapus pesan ini? Kalau ada file, file itu juga akan hilang dari chat.')) return

    const res = await fetch(`/api/chats/messages/${messageId}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))

    if (res.ok && json.data) {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, ...json.data } : m))
      void load()
    } else {
      alert(json.error ?? 'Gagal hapus pesan.')
    }
  }

  if (loading) {
    return <div className="flex h-[70vh] items-center justify-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  if (error) return <Card><CardContent className="p-6 text-sm leading-6 text-red-700">{error}</CardContent></Card>

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard/friends" className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
          <Link href={`/dashboard/profile/${friendId}`} className="flex min-w-0 items-center gap-2">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-black text-slate-600">
              {friend?.avatar_url ? <img src={friend.avatar_url} alt="" className="h-full w-full object-cover" /> : avatarText(friend?.full_name)}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-black text-slate-950">{friend?.full_name ?? 'Teman NEXA'}</span>
                <FounderVerifiedBadge founderVerified={friend?.founder_verified} email={friend?.email} compact />
                <FeaturedBadgePin badgeId={friend?.featured_badge} />
              </span>
              <span className="block truncate text-xs text-slate-500">Chat pribadi - foto, video, emoji, file</span>
              {friend?.nexa_id && <span className="block truncate text-[10px] font-black text-slate-400">NEXA ID #{friend.nexa_id}</span>}
            </span>
          </Link>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-2xl text-slate-500">💬</div>
            <p className="text-sm font-bold">Belum ada chat.</p>
            <p className="mt-1 max-w-xs text-xs leading-5">Kirim pesan pertama. Mulai dari yang simpel aja, nanti juga ngalir.</p>
          </div>
        ) : messages.map((msg) => {
          const isMe = msg.sender_id === userId
          const deleted = Boolean(msg.deleted_at)

          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-[10px] font-black text-slate-600">
                {isMe ? 'K' : friend?.avatar_url ? <img src={friend.avatar_url} alt="" className="h-full w-full object-cover" /> : avatarText(friend?.full_name)}
              </span>
              <div className={`flex max-w-[76%] flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                <p className={`text-[11px] font-bold text-slate-500 ${isMe ? 'text-right' : ''}`}>
                  <span className="inline-flex items-center gap-1">
                    {isMe ? 'Kamu' : (friend?.full_name ?? 'Teman')}
                    {!isMe && <FounderVerifiedBadge founderVerified={friend?.founder_verified} email={friend?.email} compact />}
                  </span>
                  {' - '}
                  {formatTime(msg.created_at)}
                  {msg.edited_at && !deleted ? ' - diedit' : ''}
                </p>
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${isMe ? 'rounded-tr-sm bg-teal-500 text-white' : 'rounded-tl-sm bg-slate-100 text-slate-900'}`}>
                  {deleted ? (
                    <p className="italic opacity-70">Pesan dihapus</p>
                  ) : editingId === msg.id ? (
                    <div className="space-y-2">
                      <textarea value={editingText} onChange={(event) => setEditingText(event.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900" />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="rounded-xl bg-slate-950 px-3 py-1 text-xs font-black text-white">Simpan</button>
                        <button onClick={() => setEditingId(null)} className="rounded-xl bg-white/80 px-3 py-1 text-xs font-black text-slate-700">Batal</button>
                      </div>
                    </div>
                  ) : msg.message_type === 'image' && msg.attachment_path ? (
                    <div className="space-y-1"><img src={mediaUrl(msg.attachment_path)} alt={msg.attachment_name ?? 'Gambar'} className="max-h-64 max-w-full rounded-xl object-cover" /><p className="text-[11px] opacity-70">{msg.attachment_name}</p></div>
                  ) : msg.message_type === 'video' && msg.attachment_path ? (
                    <div className="space-y-1"><video controls className="max-h-64 max-w-full rounded-xl" preload="metadata"><source src={mediaUrl(msg.attachment_path)} type={msg.attachment_mime ?? 'video/mp4'} /></video><p className="text-[11px] opacity-70">{msg.attachment_name} {formatBytes(msg.attachment_size)}</p></div>
                  ) : msg.message_type === 'file' && msg.attachment_path ? (
                    <a href={mediaUrl(msg.attachment_path)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline"><FileText className="h-4 w-4 flex-shrink-0" /><span>{msg.attachment_name}</span><span className="opacity-70">{formatBytes(msg.attachment_size)}</span></a>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {isMe && !deleted && (
                  <div className="flex gap-1.5 opacity-90">
                    {msg.message_type === 'text' && (
                      <button onClick={() => { setEditingId(msg.id); setEditingText(msg.content ?? '') }} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-700 hover:bg-slate-200">
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                    )}
                    <button onClick={() => deleteMessage(msg.id)} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600 hover:bg-red-100">
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-slate-100 p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {QUICK_REPLIES.map((reply) => (
            <button key={reply} type="button" onClick={() => setMessage((value) => value ? `${value} ${reply}` : reply)} className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200">
              {reply}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void sendFile(file); event.target.value = '' }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}</button>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage() } }} placeholder="Tulis chat pribadi..." rows={1} className="focus-ring flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" />
          <button onClick={sendMessage} disabled={!message.trim() || sending} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white transition hover:bg-teal-400 disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
        </div>
      </div>
    </div>
  )
}
