import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signAuthToken, setAuthCookie } from '@/lib/auth'
import { checkLimit, getClientIp, tooManyRequests, LIMITS } from '@/lib/rate-limit'

interface SigninBody {
  email?: string
  password?: string
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = checkLimit(`auth:${ip}`, LIMITS.auth.count, LIMITS.auth.windowMs)
  if (!rl.ok) return tooManyRequests(rl, 'Too many attempts. Please wait a minute and try again.')

  try {
    const { email, password }: SigninBody = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: "We couldn't find an account with that email. Please sign up.", code: 'NO_ACCOUNT' },
        { status: 404 },
      )
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }

    const token = await signAuthToken({ sub: user.id, email: user.email })
    setAuthCookie(token)

    return NextResponse.json({ user: { id: user.id, email: user.email } })
  } catch (e) {
    console.error('[signin]', e)
    return NextResponse.json({ error: 'Sign-in failed.' }, { status: 500 })
  }
}
