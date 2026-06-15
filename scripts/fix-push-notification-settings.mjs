import fs from 'node:fs'
import path from 'node:path'

const filePath = path.join(process.cwd(), 'src/components/settings/PushNotificationSettings.tsx')

if (!fs.existsSync(filePath)) {
  console.error(`File tidak ketemu: ${filePath}`)
  console.error('Jalankan script ini dari root project NEXA Campus, bukan dari folder zip doang.')
  process.exit(1)
}

const original = fs.readFileSync(filePath, 'utf8')
const newline = original.includes('\r\n') ? '\r\n' : '\n'
const lines = original.split(/\r?\n/)

// Vercel log nunjuk error react/no-unescaped-entities di line 221,
// kolom 31 dan 50. Jadi kita patch line itu secara sempit biar gak ngerusak
// string JS/TS lain di file.
const targetIndex = 220

if (!lines[targetIndex]) {
  console.error('Line 221 tidak ada. File mungkin sudah berubah jauh.')
  process.exit(1)
}

const before = lines[targetIndex]

if (!before.includes('"')) {
  console.log('Line 221 tidak punya tanda kutip mentah. Mungkin sudah fixed.')
  process.exit(0)
}

// Kalau line ini JSX text, replace quote mentah jadi HTML entity.
// Ini fix untuk lint rule react/no-unescaped-entities.
lines[targetIndex] = before.replace(/"/g, '&quot;')

const updated = lines.join(newline)
fs.writeFileSync(filePath, updated)

console.log('Fixed src/components/settings/PushNotificationSettings.tsx line 221')
console.log('Before:')
console.log(before)
console.log('After:')
console.log(lines[targetIndex])
