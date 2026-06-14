import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function exists(file) {
  return fs.existsSync(path.join(root, file))
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function write(file, content) {
  fs.writeFileSync(path.join(root, file), content)
}

function injectProfileShowcase(file) {
  if (!exists(file)) return false
  let src = read(file)
  if (src.includes('ProfileBadgeShowcase')) return false

  const importLine = "import ProfileBadgeShowcase from '@/components/badges/ProfileBadgeShowcase'\n"
  src = importLine + src

  const candidates = [
    /(<\/main>)/,
    /(<\/section>)/,
    /(<\/div>\s*\)\s*}\s*$)/,
  ]

  for (const pattern of candidates) {
    if (pattern.test(src)) {
      src = src.replace(pattern, "\n      <ProfileBadgeShowcase title=\"Badge yang tampil di profile\" limit={6} />\n$1")
      write(file, src)
      return true
    }
  }

  write(file, src)
  return true
}

const profileCandidates = [
  'src/app/dashboard/profile/page.tsx',
  'src/app/(dashboard)/dashboard/profile/page.tsx',
  'src/components/dashboard/ProfileView.tsx',
  'src/components/profile/ProfileView.tsx',
]

let changed = 0
for (const file of profileCandidates) {
  if (injectProfileShowcase(file)) changed += 1
}

console.log(`[v1.6.38] Badge profile showcase injector done. Files touched: ${changed}.`)
console.log('[v1.6.38] Kalau profile layout lu custom banget, tambahin manual: import ProfileBadgeShowcase lalu taruh <ProfileBadgeShowcase title="Badge yang tampil di profile" limit={6} /> di halaman profile.')
console.log('[v1.6.38] Untuk user card/page lain, pakai <PublicUserBadges userId={user.id} /> supaya badge pilihan user kebaca di semua halaman.')
