import { redirect } from 'next/navigation'

export default function ResetPasswordAliasPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const params = new URLSearchParams()

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (typeof value === 'string') params.set(key, value)
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
  })

  const query = params.toString()
  redirect(`/auth/update-password${query ? `?${query}` : ''}`)
}
