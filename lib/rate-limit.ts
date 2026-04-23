import { NextResponse } from 'next/server'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface LimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
  limit: number
}

export function checkLimit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    // Opportunistic cleanup to keep the Map from growing unbounded.
    if (buckets.size > 10_000) reapExpired(now)
    return { ok: true, remaining: limit - 1, retryAfterSec: 0, limit }
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
      limit,
    }
  }

  entry.count++
  return { ok: true, remaining: limit - entry.count, retryAfterSec: 0, limit }
}

function reapExpired(now: number): void {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key)
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export function tooManyRequests(result: LimitResult, message?: string): NextResponse {
  return NextResponse.json(
    { error: message ?? 'Too many requests. Please slow down.' },
    {
      status: 429,
      headers: {
        'Retry-After': result.retryAfterSec.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
      },
    },
  )
}

// Tuned limits by endpoint category.
export const LIMITS = {
  auth:  { count: 5,  windowMs: 60_000 },        // 5 attempts / minute / IP
  ai:    { count: 20, windowMs: 60 * 60_000 },   // 20 calls / hour / user
  write: { count: 60, windowMs: 60_000 },        // 60 writes / minute / user
} as const
