'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [mode, setMode]         = useState('signin') // 'signin' | 'signup'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [notice, setNotice]     = useState('')
  const supabase = createClient()

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function handleSignIn() {
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    setLoading(true); setError(''); setNotice('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Supabase returns the same "Invalid login credentials" for both a missing
      // account and a wrong password — we can't distinguish, so guide the user.
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError("We couldn't sign you in. If you don't have an account yet, please sign up.")
      } else if (msg.includes('email not confirmed')) {
        setError('Your email is not confirmed yet. Check your inbox for the confirmation email.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    if (data?.session) {
      await redirectAfterAuth(data.user.id)
      return
    }

    setError('Sign-in failed. Please try again.')
    setLoading(false)
  }

  async function redirectAfterAuth(userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', userId)
      .single()
    // Hard navigation so middleware sees the freshly written auth cookies.
    window.location.assign(profile?.onboarding_complete ? '/dashboard' : '/onboarding')
  }

  async function handleSignUp() {
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true); setError(''); setNotice('')

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // If email confirmation is disabled in Supabase, signUp returns a session.
    if (data?.session) {
      // Hard navigation so middleware sees the freshly written auth cookies.
      window.location.assign('/onboarding')
      return
    }

    // Otherwise, prompt them to confirm via email.
    setNotice('Account created. Check your email to confirm your address, then sign in.')
    setMode('signin')
    setPassword('')
    setLoading(false)
  }

  const submit = () => (mode === 'signin' ? handleSignIn() : handleSignUp())

  return (
    <div className="min-h-screen bg-bg flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 border-r border-border bg-card">
        <div className="text-accent font-mono text-sm tracking-widest">ContentIQ</div>
        <div>
          <h1 className="font-display text-6xl font-bold text-ink leading-tight mb-6">
            Your LinkedIn<br/>
            <span className="text-accent">Brand Engine.</span>
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-sm">
            Analyze top creators in your space. Research trending topics. Get AI-generated content ideas — all tailored to your voice, audience, and goals.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {['Personalized to your brand & voice', 'Creator intelligence + trend research', 'Save and organize all your content ideas'].map(f => (
            <div key={f} className="flex items-center gap-3 text-sm text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 lg:p-16">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden text-accent font-mono text-sm tracking-widest mb-10">ContentIQ</div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-ink mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-muted text-sm">
              {mode === 'signin'
                ? 'Sign in to continue to your dashboard.'
                : 'Sign up to start building your LinkedIn brand engine.'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8">
            {/* Mode toggle */}
            <div className="flex gap-2 mb-6 bg-bg border border-border rounded-lg p-1">
              <button
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2 rounded-md text-xs uppercase tracking-widest font-mono transition-colors ${
                  mode === 'signin' ? 'bg-accent text-black font-bold' : 'text-muted hover:text-ink'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 rounded-md text-xs uppercase tracking-widest font-mono transition-colors ${
                  mode === 'signup' ? 'bg-accent text-black font-bold' : 'text-muted hover:text-ink'
                }`}
              >
                Sign Up
              </button>
            </div>

            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-ink text-sm font-mono outline-none focus:border-accent/60 transition-colors mb-4"
              autoFocus
            />

            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Password</label>
            <input
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-ink text-sm font-mono outline-none focus:border-accent/60 transition-colors mb-4"
            />

            {notice && (
              <p className="text-accent text-xs mb-4">{notice}</p>
            )}
            {error && (
              <div className="text-red-400 text-xs mb-4 leading-relaxed">
                {error}
                {mode === 'signin' && error.toLowerCase().includes("don't have an account") && (
                  <button
                    onClick={() => switchMode('signup')}
                    className="block mt-2 text-accent underline underline-offset-2 hover:opacity-80"
                  >
                    Create an account →
                  </button>
                )}
                {mode === 'signup' && error.toLowerCase().includes('already exists') && (
                  <button
                    onClick={() => switchMode('signin')}
                    className="block mt-2 text-accent underline underline-offset-2 hover:opacity-80"
                  >
                    Go to sign in →
                  </button>
                )}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading || !email || !password}
              className="w-full bg-accent text-black font-bold tracking-widest text-xs uppercase py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                : (mode === 'signin' ? 'Sign In →' : 'Sign Up →')}
            </button>
          </div>

          <p className="text-center text-muted text-xs mt-5">
            {mode === 'signin' ? (
              <>Don't have an account?{' '}
                <button onClick={() => switchMode('signup')} className="text-accent hover:opacity-80">Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('signin')} className="text-accent hover:opacity-80">Sign in</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
