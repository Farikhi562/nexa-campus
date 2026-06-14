'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mic } from 'lucide-react'
import StudyRoomCommandActions from '@/components/study-room/StudyRoomCommandActions'
import VoiceNoteList from '@/components/study-room/VoiceNoteList'
import VoiceNoteRecorder from '@/components/study-room/VoiceNoteRecorder'

type StudyRoomVoiceNotesPageProps = {
  roomId: string
}

export default function StudyRoomVoiceNotesPage({ roomId }: StudyRoomVoiceNotesPageProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/dashboard/study-room/${roomId}`} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Balik ke room
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
            <Mic className="h-6 w-6 text-teal-500" /> Study Room Voice Notes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Rekam dan kirim VN buat anggota room. Fitur ini Command-only karena audio storage juga bukan dibayar pakai daun singkong.
          </p>
        </div>
      </div>

      <StudyRoomCommandActions />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <VoiceNoteRecorder roomId={roomId} onUploaded={() => setRefreshKey((value) => value + 1)} />
        <VoiceNoteList roomId={roomId} refreshKey={refreshKey} />
      </div>
    </div>
  )
}
