import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'

type ErrorKind = 'upload' | 'ai' | 'network' | 'generic'

const COPY: Record<ErrorKind, { title: string; why: string; action: string }> = {
  upload: {
    title: 'Upload gagal.',
    why: 'Biasanya ini terjadi karena file bukan PDF, file terlalu besar, atau koneksi upload terputus.',
    action: 'Pastikan file PDF dan ukuran kurang dari 10MB.',
  },
  ai: {
    title: 'AI sedang sibuk.',
    why: 'Server AI bisa sedang antre, terkena limit sementara, atau butuh beberapa detik untuk siap lagi.',
    action: 'Tunggu beberapa detik lalu coba lagi.',
  },
  network: {
    title: 'Koneksi bermasalah.',
    why: 'Browser tidak berhasil menghubungi server NEXA.',
    action: 'Cek internet kamu atau refresh halaman.',
  },
  generic: {
    title: 'Terjadi kesalahan.',
    why: 'Ada proses yang belum berhasil diselesaikan.',
    action: 'Coba ulangi. Kalau masih gagal, cek pesan detailnya.',
  },
}

export default function AppErrorState({
  kind = 'generic',
  message,
  onRetry,
  retryLabel = 'Coba Lagi',
}: {
  kind?: ErrorKind
  message?: string
  onRetry?: () => void
  retryLabel?: string
}) {
  const copy = COPY[kind]

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div className="min-w-0 flex-1">
          <p className="font-black text-red-950">{copy.title}</p>
          <p className="mt-1 text-sm leading-6 text-red-800">{copy.action}</p>
          <p className="mt-1 text-xs leading-5 text-red-700">{message || copy.why}</p>
          {onRetry && (
            <Button type="button" size="sm" className="mt-3 bg-red-600 hover:bg-red-700" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
