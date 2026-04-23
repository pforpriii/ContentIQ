import 'server-only'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'

export const AUTH_COOKIE = 'auth-token'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export interface SessionPayload extends JWTPayload {
  sub: string
  email: string
}

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET is not set')
    }
    return new TextEncoder().encode('dev-only-secret-change-me')
  }
  return new TextEncoder().encode(raw)
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signAuthToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

export async function verifyAuthToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null
    return payload as SessionPayload
  } catch {
    return null
  }
}

export function setAuthCookie(token: string): void {
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export function clearAuthCookie(): void {
  cookies().delete(AUTH_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(AUTH_COOKIE)?.value
  if (!token) return null
  return verifyAuthToken(token)
}
