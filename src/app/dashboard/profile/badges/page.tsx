import ProfileBadgeShowcase from '@/components/badges/ProfileBadgeShowcase'
import BadgeCollection from '@/components/badges/BadgeCollection'

export const metadata = {
  title: 'Badge Profile NEXA',
}

export default function ProfileBadgesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-3 py-4 sm:px-4 sm:py-6">
      <ProfileBadgeShowcase title="Badge yang tampil di profile" limit={6} />
      <BadgeCollection />
    </main>
  )
}
