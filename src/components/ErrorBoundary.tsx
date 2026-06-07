'use client'

import React from 'react'

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
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-4xl">😵</p>
          <div>
            <p className="text-base font-black text-red-800">Halaman gagal dimuat</p>
            <p className="mt-1 text-sm text-red-600">{this.state.message}</p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
            className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-500"
          >
            Muat Ulang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
