import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signAuthToken, setAuthCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
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
