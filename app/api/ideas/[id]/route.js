import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(_request, { params }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await prisma.savedIdea.deleteMany({
      where: { id: params.id, userId: session.sub },
    })
    if (result.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[ideas DELETE]', e)
    return NextResponse.json({ error: 'Failed to delete idea.' }, { status: 500 })
  }
}
