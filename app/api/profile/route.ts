import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { checkLimit, tooManyRequests, LIMITS } from '@/lib/rate-limit'

interface ProfileBody {
  name?: string
  role?: string
  industry?: string
  bio?: string
  experience?: string
  positioning?: string
  uniqueAngle?: string
  targetAudience?: string
  audiencePainPoints?: string
  tone?: string
  contentFormats?: string[]
  pastContent?: string
  favouriteCreators?: string[]
  onboardingComplete?: boolean
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkLimit(`write:${session.sub}`, LIMITS.write.count, LIMITS.write.windowMs)
  if (!rl.ok) return tooManyRequests(rl)

  try {
    const body: ProfileBody = await request.json()
    const data = {
      name: body.name,
      role: body.role,
      industry: body.industry,
      bio: body.bio,
      experience: body.experience,
      positioning: body.positioning,
      uniqueAngle: body.uniqueAngle,
      targetAudience: body.targetAudience,
      audiencePainPoints: body.audiencePainPoints,
      tone: body.tone,
      contentFormats: body.contentFormats ?? [],
      pastContent: body.pastContent,
      favouriteCreators: body.favouriteCreators ?? [],
      onboardingComplete: !!body.onboardingComplete,
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.sub },
      update: data,
      create: { userId: session.sub, ...data },
    })

    return NextResponse.json({ profile })
  } catch (e) {
    console.error('[profile PUT]', e)
    return NextResponse.json({ error: 'Failed to save profile.' }, { status: 500 })
  }
}
