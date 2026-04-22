import 'server-only'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export const AUTH_COOKIE = 'auth-token'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function getSecret() {
  const raw = process.env.AUTH_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET is not set')
    }
    return new TextEncoder().encode('dev-only-secret-change-me')
  }
  return new TextEncoder().encode(raw)
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function signAuthToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

export async function verifyAuthToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export function setAuthCookie(token) {
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export function clearAuthCookie() {
  cookies().delete(AUTH_COOKIE)
}

export async function getSession() {
  const token = cookies().get(AUTH_COOKIE)?.value
  if (!token) return null
  return verifyAuthToken(token)
}
