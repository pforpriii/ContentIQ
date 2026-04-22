'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const supabase = createClient()

  async function sendLink() {
    if (!email) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

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

          {!sent ? (
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold text-ink mb-2">Welcome</h2>
                <p className="text-muted text-sm">Sign in or create your account — no password needed.</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-8">
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendLink()}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-ink text-sm font-mono outline-none focus:border-accent/60 transition-colors mb-4"
                  autoFocus
                />
                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
                <button
                  onClick={sendLink}
                  disabled={loading || !email}
                  className="w-full bg-accent text-black font-bold tracking-widest text-xs uppercase py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Login Link →'}
                </button>
              </div>
              <p className="text-center text-muted text-xs mt-5">No password. Just a link to your inbox.</p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold text-ink mb-2">Check your email</h2>
                <p className="text-muted text-sm">We sent a login link to <span className="text-ink font-medium">{email}</span></p>
              </div>
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">📬</div>
                <p className="text-ink text-sm font-medium mb-2">Click the link in your email</p>
                <p className="text-muted text-xs leading-relaxed mb-6">
                  Open your email and click the <strong>"Log In"</strong> button. It will bring you straight into your dashboard.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-muted text-xs hover:text-ink transition-colors"
                >
                  ← Use a different email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
