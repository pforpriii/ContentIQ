import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      name, role, industry, bio, experience,
      positioning, unique_angle,
      target_audience, audience_pain_points,
      tone, content_formats, past_content,
      favourite_creators,
      onboarding_complete,
    } = body

    const data = {
      name, role, industry, bio, experience,
      positioning,
      uniqueAngle: unique_angle,
      targetAudience: target_audience,
      audiencePainPoints: audience_pain_points,
      tone,
      contentFormats: content_formats ?? [],
      pastContent: past_content,
      favouriteCreators: favourite_creators ?? [],
      onboardingComplete: !!onboarding_complete,
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
