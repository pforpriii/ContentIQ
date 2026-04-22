import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, { data: savedIdeas }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('saved_ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  if (!profile?.onboarding_complete) redirect('/onboarding')

  return <DashboardClient profile={profile} initialSavedIdeas={savedIdeas || []} />
}
