import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const cookieMethods = {
    getAll() {
      return request.cookies.getAll()
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
      response = NextResponse.next({ request })
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options as Partial<ResponseCookie>)
      })
    },
    get(name: string) {
      return request.cookies.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      request.cookies.set(name, value)
      response = NextResponse.next({ request })
      response.cookies.set(name, value, options as Partial<ResponseCookie>)
    },
    remove(name: string, options: CookieOptions) {
      request.cookies.set(name, '')
      response = NextResponse.next({ request })
      response.cookies.set(name, '', { ...(options as Partial<ResponseCookie>), maxAge: 0 })
    },
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/auth/update-password',
    '/privacy',
    '/terms',
    '/pricing',
    '/support',
  ]
  const isPublic = publicPaths.some((p) => path === p || path.startsWith(`${p}/`))
  const protectedPaths = ['/dashboard', '/onboarding', '/admin', '/profile']
  const isProtected = protectedPaths.some((p) => path.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (isPublic) {
    return response
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
