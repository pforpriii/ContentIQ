import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkLimit, tooManyRequests, LIMITS } from '@/lib/rate-limit'

interface IdeaBody {
  title?: string
  hook?: string | null
  format?: string | null
  angle?: string | null
  source?: string | null
  tags?: string[]
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkLimit(`write:${session.sub}`, LIMITS.write.count, LIMITS.write.windowMs)
  if (!rl.ok) return tooManyRequests(rl)

  try {
    const { title, hook, format, angle, source, tags }: IdeaBody = await request.json()
    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })

    const idea = await prisma.savedIdea.create({
      data: {
        userId: session.sub,
        title,
        hook: hook ?? null,
        format: format ?? null,
        angle: angle ?? null,
        source: source ?? null,
        tags: tags ?? [],
      },
    })
    return NextResponse.json({ idea })
  } catch (e) {
    console.error('[ideas POST]', e)
    return NextResponse.json({ error: 'Failed to save idea.' }, { status: 500 })
  }
}
