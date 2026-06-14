import UpgradePromptCard from '@/components/billing/UpgradePromptCard'
import StudyRoomVoiceNotesPage from '@/components/study-room/StudyRoomVoiceNotesPage'
import { canUseFeature } from '@/lib/billing/access'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'

type PageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function VoiceNotesPage({ params }: PageProps) {
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
          title="Voice note Study Room khusus NEXA Command"
          description="VN Study Room butuh storage audio dan mic permission. Jadi ini dikunci buat Command, bukan buat user gratisan numpang podcast."
        />
      </main>
    )
  }

  return <StudyRoomVoiceNotesPage roomId={resolvedParams.id} />
}
