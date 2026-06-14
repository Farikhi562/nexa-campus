import JitsiRoomCall from '@/components/study-room/JitsiRoomCall'

type PageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function StudyRoomCallPage({ params }: PageProps) {
  const resolvedParams = await params

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <JitsiRoomCall roomId={resolvedParams.id} />
    </main>
  )
}
