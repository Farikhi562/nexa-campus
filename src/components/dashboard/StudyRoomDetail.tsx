'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, ChevronLeft, Copy, Crown, Edit2, FileText, Image as ImageIcon,
  Loader2, LogOut, MoreVertical, Paperclip, Send, Settings, Shield, Trash2, UserMinus, UserPlus, Users, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { StudyRoom, StudyRoomMember, StudyRoomMessage, StudyRoomJoinRequest, RoomMemberRole } from '@/types'
import Link from 'next/link'

function initials(name?: string | null) {
  if (!name) return 'N'
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'N'
}

function Avatar({ url, name, size = 'md' }: { url?: string | null; name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs'
  return (
    <span className={`flex ${s} flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 font-black text-slate-600`}>
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  )
}

function RoleBadge({ role }: { role: RoomMemberRole }) {
  const styles: Record<RoomMemberRole, string> = {
    owner: 'bg-amber-100 text-amber-700',
    admin: 'bg-teal-100 text-teal-700',
    moderator: 'bg-blue-100 text-blue-700',
    member: 'bg-slate-100 text-slate-600',
  }
  const labels: Record<RoomMemberRole, string> = { owner: 'Owner', admin: 'Admin', moderator: 'Mod', member: 'Member' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${styles[role]}`}>
      {role === 'owner' && <Crown className="h-2.5 w-2.5" />}
      {role === 'admin' && <Shield className="h-2.5 w-2.5" />}
      {labels[role]}
    </span>
  )
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function StudyRoomDetail({ roomId, userId }: { roomId: string; userId: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [messages, setMessages] = useState<StudyRoomMessage[]>([])
  const [members, setMembers] = useState<StudyRoomMember[]>([])
  const [joinRequests, setJoinRequests] = useState<StudyRoomJoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileTab, setMobileTab] = useState<'chat' | 'members'>('chat')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const myMembership = members.find((m) => m.user_id === userId)
  const myRole = myMembership?.role ?? null
  const canManage = myRole === 'owner' || myRole === 'admin'

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [roomRes, msgRes, memberRes] = await Promise.all([
      fetch(`/api/study-rooms/${roomId}`, { cache: 'no-store' }),
      fetch(`/api/study-rooms/${roomId}/messages?limit=50`, { cache: 'no-store' }),
      fetch(`/api/study-rooms/${roomId}/members`, { cache: 'no-store' }),
    ])
    const [roomJson, msgJson, memberJson] = await Promise.all([roomRes.json(), msgRes.json(), memberRes.json()])
    if (!roomRes.ok) { setError(roomJson.error ?? 'Room tidak ditemukan.'); setLoading(false); return }
    setRoom(roomJson.data)
    setMessages(msgRes.ok ? (msgJson.data ?? []) : [])
    setMembers(memberRes.ok ? (memberJson.data ?? []) : [])
    setLoading(false)
  }, [roomId])

  const loadJoinRequests = useCallback(async () => {
    if (!canManage) return
    const res = await fetch(`/api/study-rooms/${roomId}/requests`, { cache: 'no-store' })
    const json = await res.json()
    if (res.ok) setJoinRequests(json.data ?? [])
  }, [roomId, canManage])

  useEffect(() => { void loadAll() }, [loadAll])
  useEffect(() => { void loadJoinRequests() }, [loadJoinRequests])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`study-room-${roomId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newMsg = payload.new as StudyRoomMessage
          // Enrich with sender from current members
          const sender = members.find((m) => m.user_id === newMsg.sender_id)?.profile ?? null
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [...prev, { ...newMsg, sender }]
          })
        })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [roomId, supabase, members])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function sendMessage() {
    if (!message.trim() || sending) return
    setSending(true)
    const text = message.trim()
    setMessage('')
    const res = await fetch(`/api/study-rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, message_type: 'text' }),
    })
    if (!res.ok) {
      const json = await res.json()
      setMessage(text)
      alert(json.error ?? 'Gagal kirim pesan.')
    }
    setSending(false)
  }

  async function sendFile(file: File) {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const upRes = await fetch(`/api/study-rooms/${roomId}/upload`, { method: 'POST', body: formData })
    const upJson = await upRes.json()
    if (!upRes.ok) { alert(upJson.error ?? 'Gagal upload file.'); setUploading(false); return }
    const att = upJson.data
    await fetch(`/api/study-rooms/${roomId}/messages`, {
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
    setUploading(false)
  }

  async function handleJoinRequest(requestId: string, action: 'approve' | 'reject') {
    await fetch(`/api/study-rooms/${roomId}/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await loadJoinRequests()
    if (action === 'approve') await loadAll()
  }

  async function handleRoleChange(targetUserId: string, role: RoomMemberRole) {
    const res = await fetch(`/api/study-rooms/${roomId}/members/${targetUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) await loadAll()
    else { const j = await res.json(); alert(j.error) }
  }

  async function handleRemoveMember(targetUserId: string) {
    if (!confirm('Keluarkan member ini?')) return
    const res = await fetch(`/api/study-rooms/${roomId}/members/${targetUserId}`, { method: 'DELETE' })
    if (res.ok) await loadAll()
    else { const j = await res.json(); alert(j.error) }
  }

  async function handleLeave() {
    if (!confirm(myRole === 'owner' ? 'Kamu owner. Keluar akan menutup room. Yakin?' : 'Keluar dari room ini?')) return
    const res = await fetch(`/api/study-rooms/${roomId}/leave`, { method: 'POST' })
    if (res.ok) router.push('/dashboard/study-room')
    else { const j = await res.json(); alert(j.error) }
  }

  async function handleDeleteRoom() {
    if (!confirm('Hapus room ini secara permanen? Semua chat dan anggota akan hilang.')) return
    const res = await fetch(`/api/study-rooms/${roomId}`, { method: 'DELETE' })
    if (res.ok) router.push('/dashboard/study-room')
    else { const j = await res.json(); alert(j.error) }
  }

  function copyCode() {
    navigator.clipboard.writeText(room?.room_code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
  if (error) return (
    <Card><CardContent className="p-8 text-center">
      <p className="text-red-600">{error}</p>
      <Link href="/dashboard/study-room" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal-700 underline">
        <ChevronLeft className="h-4 w-4" /> Kembali ke Study Room
      </Link>
    </CardContent></Card>
  )
  if (!room) return null

  if (!room.is_member) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-black text-slate-950">{room.title}</h2>
          <p className="text-sm text-slate-500">
            {room.visibility === 'private'
              ? 'Room ini private. Minta izin dulu, jangan main nerobos kayak deadline H-1.'
              : 'Kamu belum gabung room ini.'}
          </p>
          {room.has_pending_request ? (
            <Badge tone="warning">Permintaan join sedang diproses...</Badge>
          ) : (
            <Link href="/dashboard/study-room">
              <Button className="rounded-2xl">Kembali ke daftar room</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard/study-room" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-slate-950">{room.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{room.current_members_count}/{room.max_members} anggota</span>
              <button onClick={copyCode} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-black text-slate-700 hover:bg-slate-200">
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {room.room_code}
              </button>
              {room.visibility === 'private' && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Private</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && joinRequests.length > 0 && (
            <button className="flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-black text-teal-700">
              <UserPlus className="h-3.5 w-3.5" /> {joinRequests.length}
            </button>
          )}
          <button onClick={() => setMobileTab(mobileTab === 'chat' ? 'members' : 'chat')}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden">
            <Users className="h-5 w-5" />
          </button>
          {canManage && <button onClick={() => setShowSettings(true)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100">
            <Settings className="h-5 w-5" />
          </button>}
          <button onClick={handleLeave} className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Chat area */}
        <div className={`flex flex-1 flex-col overflow-hidden ${mobileTab === 'members' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-sm font-bold">Belum ada pesan.</p>
                <p className="text-xs mt-1">Mulai diskusi, atau minimal bilang halo dulu.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === userId
                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar url={msg.sender?.avatar_url} name={msg.sender?.full_name} size="sm" />
                    <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <p className={`text-[11px] font-bold text-slate-500 ${isMe ? 'text-right' : ''}`}>
                        {isMe ? 'Kamu' : (msg.sender?.full_name ?? 'Anggota')} · {formatTime(msg.created_at)}
                      </p>
                      <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                        isMe ? 'rounded-tr-sm bg-teal-500 text-white' : 'rounded-tl-sm bg-slate-100 text-slate-900'
                      }`}>
                        {msg.message_type === 'image' && msg.attachment_path ? (
                          <div className="space-y-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/room-attachments/${msg.attachment_path}`}
                              alt={msg.attachment_name ?? 'Gambar'}
                              className="max-h-48 max-w-full rounded-xl object-cover"
                            />
                            <p className="text-[11px] opacity-70">{msg.attachment_name}</p>
                          </div>
                        ) : msg.message_type === 'file' && msg.attachment_path ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/room-attachments/${msg.attachment_path}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 underline"
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span>{msg.attachment_name}</span>
                            {msg.attachment_size && <span className="opacity-70">({formatBytes(msg.attachment_size)})</span>}
                          </a>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="flex-shrink-0 border-t border-slate-100 p-3">
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void sendFile(f); e.target.value = '' }}
              />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }}
                placeholder="Kirim pesan... (Enter untuk kirim)"
                rows={1}
                className="focus-ring flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
              />
              <button onClick={sendMessage} disabled={!message.trim() || sending}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white transition hover:bg-teal-400 disabled:opacity-40">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Members panel */}
        <div className={`${mobileTab === 'members' ? 'flex' : 'hidden lg:flex'} w-full flex-col overflow-hidden border-l border-slate-100 bg-slate-50/50 lg:w-72`}>
          {/* Join requests (for admins) */}
          {canManage && joinRequests.length > 0 && (
            <div className="flex-shrink-0 border-b border-slate-100 p-3">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                Permintaan bergabung ({joinRequests.length})
              </p>
              <div className="space-y-2">
                {joinRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white p-2.5 shadow-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar url={req.user?.avatar_url} name={req.user?.full_name} size="sm" />
                      <p className="truncate text-xs font-black text-slate-950">{req.user?.full_name ?? 'User'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleJoinRequest(req.id, 'approve')}
                        className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleJoinRequest(req.id, 'reject')}
                        className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
              Anggota ({members.length})
            </p>
            <div className="space-y-1.5">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between gap-2 rounded-2xl bg-white p-2.5 shadow-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar url={member.profile?.avatar_url} name={member.profile?.full_name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-950">
                        {member.user_id === userId ? 'Kamu' : (member.profile?.full_name ?? 'Member')}
                      </p>
                      <RoleBadge role={member.role} />
                    </div>
                  </div>
                  {canManage && member.user_id !== userId && member.role !== 'owner' && (
                    <div className="relative group">
                      <button className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute right-0 top-8 z-10 hidden w-40 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl group-hover:block">
                        {myRole === 'owner' && (
                          <>
                            {member.role !== 'admin' && (
                              <button onClick={() => handleRoleChange(member.user_id, 'admin')}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                <Shield className="h-3.5 w-3.5" /> Jadikan Admin
                              </button>
                            )}
                            {member.role !== 'moderator' && (
                              <button onClick={() => handleRoleChange(member.user_id, 'moderator')}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                <Shield className="h-3.5 w-3.5" /> Jadikan Moderator
                              </button>
                            )}
                            {member.role !== 'member' && (
                              <button onClick={() => handleRoleChange(member.user_id, 'member')}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                <UserMinus className="h-3.5 w-3.5" /> Turunkan ke Member
                              </button>
                            )}
                          </>
                        )}
                        <button onClick={() => handleRemoveMember(member.user_id)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                          <UserMinus className="h-3.5 w-3.5" /> Keluarkan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {myRole === 'owner' && (
            <div className="flex-shrink-0 border-t border-slate-100 p-3">
              <button onClick={handleDeleteRoom}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-2.5 text-xs font-black text-red-600 hover:bg-red-100">
                <Trash2 className="h-4 w-4" /> Hapus Room
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && room && (
        <RoomSettingsModal
          room={room}
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); void loadAll() }}
        />
      )}
    </div>
  )
}

function RoomSettingsModal({ room, onClose, onSaved }: { room: StudyRoom; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(room.title)
  const [description, setDescription] = useState(room.description ?? '')
  const [topic, setTopic] = useState(room.topic ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!title.trim()) { setError('Judul wajib diisi.'); return }
    setSaving(true)
    const res = await fetch(`/api/study-rooms/${room.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null, topic: topic.trim() || null }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Gagal menyimpan.'); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950">Pengaturan Room</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Nama Room</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Topik</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="cth: kalkulus-integral" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Deskripsi</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </div>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex gap-2">
          <Button onClick={save} disabled={saving} className="flex-1 rounded-2xl">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button onClick={onClose} variant="outline" className="rounded-2xl">Batal</Button>
        </div>
      </div>
    </div>
  )
}
