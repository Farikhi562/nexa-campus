import Link from 'next/link'
import { FileText, Play, Trash2, Clock } from 'lucide-react'
import { Card } from './ui/Card'
import { StatusBadge } from './ui/Badge'
import Button from './ui/Button'
import type { Document } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

interface DocumentCardProps {
  doc: Document
  onDelete: (id: string) => void
  onStartExam: (docId: string) => void
  disabled?: boolean
}

export default function DocumentCard({ doc, onDelete, onStartExam, disabled }: DocumentCardProps) {
  const timeAgo = formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: id })

  return (
    <Card className="flex flex-col">
      <div className="p-5 flex-1">
        {/* Icon + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <StatusBadge status={doc.status} />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1 line-clamp-2">
          {doc.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeAgo}</span>
          {doc.status === 'completed' && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-brand-600 font-medium">{doc.question_count} soal</span>
            </>
          )}
        </div>

        {/* Error message */}
        {doc.status === 'error' && doc.error_message && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
            {doc.error_message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        {doc.status === 'completed' && doc.question_count > 0 && (
          <Button
            size="sm"
            onClick={() => onStartExam(doc.id)}
            disabled={disabled}
            className="flex-1"
          >
            <Play className="w-3.5 h-3.5" />
            Mulai Ujian
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(doc.id)}
          className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  )
}
