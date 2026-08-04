'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message ?? 'Unknown error' }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-xl shadow-slate-200/70 ring-1 ring-slate-950/[0.03] backdrop-blur">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-black text-slate-950">Halaman gagal dimuat</p>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">Coba muat ulang halamannya.</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="mt-1 text-xs text-slate-400">{this.state.message}</p>
            )}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
            className="rounded-2xl bg-blue-400 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-blue-300"
          >
            Muat Ulang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
