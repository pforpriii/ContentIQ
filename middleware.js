import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_COOKIE = 'auth-token'

function getSecret() {
  const raw = process.env.AUTH_SECRET || 'dev-only-secret-change-me'
  return new TextEncoder().encode(raw)
}

async function readUser(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const user = await readUser(request)

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
