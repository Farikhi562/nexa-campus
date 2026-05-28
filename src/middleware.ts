import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const path = request.nextUrl.pathname

  // Skip middleware for auth routes
  if (path.startsWith('/auth/')) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set(name, value)
          response = NextResponse.next({ request })
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set(name, '')
          response = NextResponse.next({ request })
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard & exam routes
  const protectedPaths = ['/dashboard', '/exam', '/study-room', '/marketplace']
  const isProtected = protectedPaths.some(p => path.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
