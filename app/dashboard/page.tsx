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

  const profile = { ...user.profile, email: user.email }

  return <DashboardClient profile={profile} initialSavedIdeas={savedIdeas} />
}
