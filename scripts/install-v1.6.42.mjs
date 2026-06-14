import fs from 'node:fs'

const checks = [
  'src/components/badges/BadgeCollection.tsx',
  'src/components/badges/ProfileBadgeShowcase.tsx',
  'src/app/api/badges/pin/route.ts',
  'src/app/api/badges/me/route.ts',
  'src/app/api/badges/[userId]/route.ts',
]

for (const file of checks) {
  if (!fs.existsSync(file)) {
    console.warn(`[v1.6.42] File belum ketemu setelah copy: ${file}`)
  }
}

console.log('[v1.6.42] Single profile badge showcase installed. Jalankan migration 20260615_single_profile_badge_showcase.sql lalu npm run build.')
