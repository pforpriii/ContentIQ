'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const [status, setStatus] = useState('Signing you in...')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get session - Supabase client auto-detects tokens in URL
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setStatus('Almost there...')
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single()
          router.push(profile?.onboarding_complete ? '/dashboard' : '/onboarding')
          return
        }

        // Try code exchange (PKCE flow)
        const code = new URL(window.location.href).searchParams.get('code')
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (data?.session) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_complete')
              .eq('id', data.session.user.id)
              .single()
            router.push(profile?.onboarding_complete ? '/dashboard' : '/onboarding')
            return
          }
        }

        // Fallback - wait a moment and try again (token might still be processing)
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_complete')
              .eq('id', retrySession.user.id)
              .single()
            router.push(profile?.onboarding_complete ? '/dashboard' : '/onboarding')
          } else {
            router.push('/?error=auth')
          }
        }, 2000)

      } catch (e) {
        router.push('/?error=auth')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-accent font-mono text-sm tracking-widest">{status}</p>
      </div>
    </div>
  )
}
