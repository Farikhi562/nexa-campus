import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // set called from a Server Component is safe to ignore.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // remove called from a Server Component is safe to ignore.
          }
        },
      },
    }
  )
}

/** Service-role client — bypasses RLS. Use only in trusted API routes. */
export function createServiceClient() {
  const { createClient } = require('@supabase/supabase-js')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service client')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
