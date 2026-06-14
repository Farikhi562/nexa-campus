import AdminPaymentsPanel from '@/components/admin/AdminPaymentsPanel'

export const dynamic = 'force-dynamic'

export default function AdminPaymentsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <AdminPaymentsPanel />
    </main>
  )
}
