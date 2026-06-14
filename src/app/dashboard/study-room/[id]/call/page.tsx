import JitsiRoomCall from '@/components/study-room/JitsiRoomCall'
import UpgradePromptCard from '@/components/billing/UpgradePromptCard'
import { canUseFeature } from '@/lib/billing/access'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'

type PageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function StudyRoomCallPage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  const access = user ? await getUserPlanAccess({ supabase, user }) : null
  const plan = access?.plan ?? 'radar'

  if (!canUseFeature(plan, 'study_room_voice_video')) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <UpgradePromptCard
          featureKey="study_room_voice_video"
          title="Voice/video call khusus NEXA Command"
          description="Study Room call pakai Jitsi dibuka buat Command. Radar dan Pulse masih bisa belajar, cuma belum bisa cosplay jadi Zoom akademik."
        />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <JitsiRoomCall roomId={resolvedParams.id} />
    </main>
  )
}
