import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const [user, savedIdeas] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.sub },
      include: { profile: true },
    }),
    prisma.savedIdea.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!user) redirect('/')
  if (!user.profile?.onboardingComplete) redirect('/onboarding')

  const profile = {
    ...user.profile,
    email: user.email,
    content_formats: user.profile.contentFormats,
    favourite_creators: user.profile.favouriteCreators,
    target_audience: user.profile.targetAudience,
    audience_pain_points: user.profile.audiencePainPoints,
    unique_angle: user.profile.uniqueAngle,
    past_content: user.profile.pastContent,
    onboarding_complete: user.profile.onboardingComplete,
  }

  return <DashboardClient profile={profile} initialSavedIdeas={savedIdeas} />
}
