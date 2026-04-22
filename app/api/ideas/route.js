import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, hook, format, angle, source, tags } = await request.json()
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
