import { createBrowserClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined

          const value = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith(`${name}=`))
            ?.split('=')
            .slice(1)
            .join('=')

          return value ? decodeURIComponent(value) : undefined
        },
        set(name: string, value: string, options: CookieOptions) {
          if (typeof document === 'undefined') return

          document.cookie = serializeCookie(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          if (typeof document === 'undefined') return

          document.cookie = serializeCookie(name, '', {
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )
}

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? '/'}`,
    typeof options.maxAge === 'number' ? `Max-Age=${options.maxAge}` : '',
    options.domain ? `Domain=${options.domain}` : '',
    options.expires ? `Expires=${options.expires.toUTCString()}` : '',
    options.secure ? 'Secure' : '',
    options.httpOnly ? 'HttpOnly' : '',
    options.sameSite ? `SameSite=${options.sameSite}` : 'SameSite=Lax',
  ].filter(Boolean)

  return parts.join('; ')
}
