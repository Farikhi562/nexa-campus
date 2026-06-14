import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function file(rel) {
  return path.join(root, rel)
}

function exists(rel) {
  return fs.existsSync(file(rel))
}

function read(rel) {
  return fs.readFileSync(file(rel), 'utf8')
}

function write(rel, content) {
  fs.writeFileSync(file(rel), content)
}

function insertImport(source, importLine) {
  if (source.includes(importLine.trim()) || source.includes(importLine.split(' from ')[1]?.replace(/['\n]/g, '') || '__never__')) return source
  const lines = source.split('\n')
  let insertAt = 0
  while (
    insertAt < lines.length &&
    (lines[insertAt].trim() === '' || lines[insertAt].startsWith('import ') || lines[insertAt].startsWith("'use ") || lines[insertAt].startsWith('"use '))
  ) {
    insertAt++
  }
  lines.splice(insertAt, 0, importLine.trimEnd())
  return lines.join('\n')
}

function injectBeforeClosing(source, component) {
  if (source.includes(component.trim())) return source
  const targets = ['</main>', '</section>', '</article>', '</div>']
  for (const target of targets) {
    const idx = source.lastIndexOf(target)
    if (idx !== -1) {
      return `${source.slice(0, idx)}\n      ${component}\n${source.slice(idx)}`
    }
  }
  return source
}

function patchCurrentUserBadgeBlock(rel, label) {
  if (!exists(rel)) return false
  let src = read(rel)
  const before = src
  src = insertImport(src, "import CurrentUserBadges from '@/components/badges/CurrentUserBadges'\n")
  src = injectBeforeClosing(src, `<CurrentUserBadges label=\"${label}\" limit={6} className=\"mt-4\" />`)
  if (src !== before) {
    write(rel, src)
    return true
  }
  return false
}

function patchPublicBadgesAfterName(rel) {
  if (!exists(rel)) return false
  let src = read(rel)
  const before = src
  if (src.includes('PublicUserBadges')) return false

  const candidates = [
    { name: 'friend', id: "(friend as any).id || (friend as any).user_id" },
    { name: 'member', id: "(member as any).id || (member as any).user_id" },
    { name: 'user', id: "(user as any).id || (user as any).user_id" },
    { name: 'profile', id: "(profile as any).id || (profile as any).user_id" },
    { name: 'row', id: "(row as any).id || (row as any).user_id" },
    { name: 'item', id: "(item as any).id || (item as any).user_id" },
  ]

  let selected = null
  for (const item of candidates) {
    if (src.includes(`${item.name}.full_name`) || src.includes(`${item.name}.name`) || src.includes(`${item.name}.email`) || src.includes(`${item.name}.username`)) {
      selected = item
      break
    }
  }

  if (!selected) return false

  src = insertImport(src, "import PublicUserBadges from '@/components/badges/PublicUserBadges'\n")
  const snippet = `<PublicUserBadges userId={${selected.id}} limit={4} className=\"mt-1\" />`

  // Taruh setelah baris pertama yang menampilkan nama/email variable tersebut.
  const lines = src.split('\n')
  const idx = lines.findIndex((line) =>
    (line.includes(`${selected.name}.full_name`) || line.includes(`${selected.name}.name`) || line.includes(`${selected.name}.email`) || line.includes(`${selected.name}.username`)) &&
    !line.includes('PublicUserBadges')
  )

  if (idx !== -1) {
    lines.splice(idx + 1, 0, `              ${snippet}`)
    src = lines.join('\n')
  }

  if (src !== before) {
    write(rel, src)
    return true
  }
  return false
}

const currentUserTargets = [
  ['src/app/dashboard/page.tsx', 'Badge profile kamu'],
  ['src/app/dashboard/profile/page.tsx', 'Badge yang tampil di profile'],
  ['src/app/profile/page.tsx', 'Badge yang tampil di profile'],
  ['src/components/dashboard/ProfileView.tsx', 'Badge yang tampil di profile'],
  ['src/components/profile/ProfileView.tsx', 'Badge yang tampil di profile'],
  ['src/components/dashboard/DashboardHome.tsx', 'Badge profile kamu'],
  ['src/components/dashboard/DashboardOverview.tsx', 'Badge profile kamu'],
  ['src/components/dashboard/ProfileCard.tsx', 'Badge profile kamu'],
]

const publicTargets = [
  'src/components/dashboard/FriendsView.tsx',
  'src/components/dashboard/FriendSuggestionsCard.tsx',
  'src/components/dashboard/OnlineFriendsStrip.tsx',
  'src/components/dashboard/PrivateChatView.tsx',
  'src/components/dashboard/StudyRoomDetail.tsx',
  'src/components/dashboard/StudyRoomView.tsx',
  'src/components/dashboard/ArenaTeamWorkspaceView.tsx',
  'src/components/dashboard/LeaderboardView.tsx',
  'src/components/dashboard/ActivityFeedCard.tsx',
  'src/components/friends/FriendsView.tsx',
  'src/components/leaderboard/LeaderboardView.tsx',
  'src/components/study-room/StudyRoomDetail.tsx',
  'src/components/arena/ArenaTeamWorkspaceView.tsx',
]

const patchedCurrent = []
for (const [rel, label] of currentUserTargets) {
  if (patchCurrentUserBadgeBlock(rel, label)) patchedCurrent.push(rel)
}

const patchedPublic = []
for (const rel of publicTargets) {
  if (patchPublicBadgesAfterName(rel)) patchedPublic.push(rel)
}

const required = [
  'src/components/badges/UnifiedBadgeStrip.tsx',
  'src/components/badges/PublicUserBadges.tsx',
  'src/components/badges/ProfileBadgeShowcase.tsx',
  'src/components/badges/BadgeCollection.tsx',
  'src/app/api/badges/me/route.ts',
  'src/app/api/badges/[userId]/route.ts',
]

const missing = required.filter((rel) => !exists(rel))
if (missing.length) {
  console.warn('[v1.6.40] Missing files setelah copy:')
  for (const item of missing) console.warn(`- ${item}`)
}

console.log('[v1.6.40] Badge consistency installed.')
console.log(`- Current-user badge blocks patched: ${patchedCurrent.length}`)
for (const item of patchedCurrent) console.log(`  • ${item}`)
console.log(`- Public user badge strips patched: ${patchedPublic.length}`)
for (const item of patchedPublic) console.log(`  • ${item}`)

console.log('\nKalau masih ada badge lama di file custom, pakai komponen ini:')
console.log("import PublicUserBadges from '@/components/badges/PublicUserBadges'")
console.log('<PublicUserBadges userId={user.id} limit={4} />')
console.log('\nUntuk profile/current user:')
console.log("import CurrentUserBadges from '@/components/badges/CurrentUserBadges'")
console.log('<CurrentUserBadges limit={6} />')
