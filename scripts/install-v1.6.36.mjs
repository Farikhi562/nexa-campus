import fs from 'fs'
import path from 'path'

const root = process.cwd()
const importLine = "import ProfileBadgeShowcase from '@/components/badges/ProfileBadgeShowcase'\n"
const componentLine = '\n      <ProfileBadgeShowcase compact limit={6} />\n'

const candidates = [
  'src/app/dashboard/profile/page.tsx',
  'src/app/profile/page.tsx',
  'src/components/dashboard/ProfileView.tsx',
  'src/components/profile/ProfileView.tsx',
  'src/components/dashboard/ProfilePanel.tsx',
  'src/components/ProfilePage.tsx',
]

function insertImport(source) {
  if (source.includes("@/components/badges/ProfileBadgeShowcase")) return source
  const lines = source.split('\n')
  let insertAt = 0
  while (insertAt < lines.length && (lines[insertAt].startsWith('import ') || lines[insertAt].trim() === '' || lines[insertAt].startsWith("'use "))) {
    insertAt++
  }
  lines.splice(insertAt, 0, importLine.trimEnd())
  return lines.join('\n')
}

function insertShowcase(source) {
  if (source.includes('<ProfileBadgeShowcase')) return source

  const mainIdx = source.lastIndexOf('</main>')
  if (mainIdx !== -1) {
    return source.slice(0, mainIdx) + componentLine + source.slice(mainIdx)
  }

  const sectionIdx = source.lastIndexOf('</section>')
  if (sectionIdx !== -1) {
    return source.slice(0, sectionIdx) + componentLine + source.slice(sectionIdx)
  }

  const divIdx = source.lastIndexOf('</div>')
  if (divIdx !== -1) {
    return source.slice(0, divIdx) + componentLine + source.slice(divIdx)
  }

  return source
}

let patched = []
for (const rel of candidates) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) continue
  const before = fs.readFileSync(file, 'utf8')
  let after = insertImport(before)
  after = insertShowcase(after)
  if (after !== before) {
    fs.writeFileSync(file, after)
    patched.push(rel)
  }
}

if (patched.length) {
  console.log('✅ Profile badge showcase injected into:')
  for (const item of patched) console.log(`- ${item}`)
} else {
  console.log('⚠️ Tidak nemu file profile yang aman buat auto-inject.')
  console.log('Tambahkan manual di halaman profile kamu:')
  console.log("import ProfileBadgeShowcase from '@/components/badges/ProfileBadgeShowcase'")
  console.log('<ProfileBadgeShowcase compact limit={6} />')
}
