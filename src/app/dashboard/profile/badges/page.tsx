import ProfileBadgeShowcase from '@/components/badges/ProfileBadgeShowcase'
import BadgeCollection from '@/components/badges/BadgeCollection'

export default function ProfileBadgesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <ProfileBadgeShowcase title="Badge yang tampil di Profile" limit={8} />
      <div className="mt-6">
        <BadgeCollection />
      </div>
    </main>
  )
}
