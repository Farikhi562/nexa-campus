import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'src/lib/badges/catalog.ts',
  'src/lib/badges/owner.ts',
  'src/lib/badges/sync.ts',
  'src/app/api/badges/me/route.ts',
  'src/app/api/badges/sync/route.ts',
  'supabase/migrations/20260615_badge_owner_unlock_subscription_milestones.sql',
]

for (const file of required) {
  const full = path.join(root, file)
  if (!fs.existsSync(full)) {
    console.warn(`[v1.6.39] Missing after copy: ${file}`)
  }
}

console.log('[v1.6.39] Badge unlock rules installed. Run the Supabase migration, then npm run build. Human civilization may continue for one more deploy.')
