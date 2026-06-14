import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8')
}

function injectResponsiveCss() {
  const globals = path.join(root, 'src', 'app', 'globals.css')
  if (!fs.existsSync(globals)) {
    console.log('[v1.6.34] src/app/globals.css tidak ketemu, skip responsive CSS import.')
    return
  }
  const content = read(globals)
  const line = "@import '../styles/nexa-responsive-fixes.css';"
  if (content.includes('nexa-responsive-fixes.css')) {
    console.log('[v1.6.34] responsive CSS sudah ada.')
    return
  }
  write(globals, `${line}\n${content}`)
  console.log('[v1.6.34] responsive CSS import ditambahkan ke src/app/globals.css')
}

function injectStudyRoomActions() {
  const file = path.join(root, 'src', 'components', 'dashboard', 'StudyRoomDetail.tsx')
  if (!fs.existsSync(file)) {
    console.log('[v1.6.34] StudyRoomDetail.tsx tidak ketemu. Tambahkan <StudyRoomCommandActions /> manual di halaman detail room.')
    return
  }

  let content = read(file)
  if (content.includes('StudyRoomCommandActions')) {
    console.log('[v1.6.34] StudyRoomCommandActions sudah ada di StudyRoomDetail.')
    return
  }

  const importLine = "import StudyRoomCommandActions from '@/components/study-room/StudyRoomCommandActions'\n"
  const importMatch = content.match(/^(?:'use client'\n\n)?((?:import[^\n]+\n)+)/)
  if (importMatch) {
    content = content.replace(importMatch[0], `${importMatch[0]}${importLine}`)
  } else {
    content = `${importLine}${content}`
  }

  // Sisipkan action bar sebagai anak pertama dari root JSX setelah return (<tag ...>)
  const patterns = [
    /(return\s*\(\s*<main[^>]*>)/,
    /(return\s*\(\s*<section[^>]*>)/,
    /(return\s*\(\s*<div[^>]*>)/,
  ]

  let injected = false
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, `$1\n      <StudyRoomCommandActions />`)
      injected = true
      break
    }
  }

  if (!injected) {
    console.log('[v1.6.34] Gagal auto-inject JSX. Tambahkan manual: <StudyRoomCommandActions /> di dalam StudyRoomDetail.')
  } else {
    write(file, content)
    console.log('[v1.6.34] Tombol Video Call / Voice Only / Voice Note ditambahkan ke StudyRoomDetail.')
  }
}

injectResponsiveCss()
injectStudyRoomActions()
