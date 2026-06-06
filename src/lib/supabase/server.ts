import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const cookieMethods = {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      } catch {
        // Safe to ignore when called from Server Components.
      }
    },
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set(name, value, options)
      } catch {
        // Safe to ignore when called from Server Components.
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set(name, '', { ...options, maxAge: 0 })
      } catch {
        // Safe to ignore when called from Server Components.
      }
    },
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: cookieMethods,
    }
  )
}
