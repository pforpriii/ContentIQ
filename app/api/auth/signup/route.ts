import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signAuthToken, setAuthCookie } from '@/lib/auth'
import { checkLimit, getClientIp, tooManyRequests, LIMITS } from '@/lib/rate-limit'

interface SignupBody {
  email?: string
  password?: string
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = checkLimit(`auth:${ip}`, LIMITS.auth.count, LIMITS.auth.windowMs)
  if (!rl.ok) return tooManyRequests(rl, 'Too many attempts. Please wait a minute and try again.')

  try {
    const { email, password }: SignupBody = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.', code: 'ACCOUNT_EXISTS' },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: {} },
      },
    })

    const token = await signAuthToken({ sub: user.id, email: user.email })
    setAuthCookie(token)

    return NextResponse.json({ user: { id: user.id, email: user.email } })
  } catch (e) {
    console.error('[signup]', e)
    return NextResponse.json({ error: 'Sign-up failed.' }, { status: 500 })
  }
}
