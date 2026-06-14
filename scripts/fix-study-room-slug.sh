#!/usr/bin/env bash
set -e

OLD="src/app/dashboard/study-room/[roomId]"
NEW="src/app/dashboard/study-room/[id]"

mkdir -p "$NEW"

if [ -d "$OLD/call" ]; then
  rm -rf "$NEW/call"
  mv "$OLD/call" "$NEW/call"
fi

rm -rf "$OLD"

cat > "$NEW/call/page.tsx" <<'TS'
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
TS

echo "Fixed: study-room dynamic segment renamed from [roomId] to [id]."
