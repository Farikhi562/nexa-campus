export const UG_PORTALS = [
  { name: 'Studentsite', url: 'https://studentsite.gunadarma.ac.id', description: 'Update nilai & KRS' },
  { name: 'V-Class', url: 'https://v-class.gunadarma.ac.id', description: 'Kuliah online & tugas' },
  { name: 'BAAK', url: 'https://baak.gunadarma.ac.id', description: 'Info administrasi & jadwal' },
  { name: 'iLab', url: 'https://ilab.gunadarma.ac.id', description: 'Praktikum mahasiswa' },
  { name: 'Lepkom', url: 'https://lepkom.gunadarma.ac.id', description: 'Kursus & sertifikasi' },
]

// API untuk cek status portal (Simulasi ping)
export async function checkPortalStatus(url: string) {
  try {
    const res = await fetch(url, { method: 'HEAD', next: { revalidate: 300 } }) // Cache 5 menit
    return res.ok ? 'online' : 'slow'
  } catch {
    return 'offline'
  }
}