'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState('')
  const [step, setStep]       = useState('email')  // 'email' | 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const supabase = createClient()
  const router   = useRouter()

  async function sendOTP() {
    if (!email) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) setError(error.message)
    else setStep('otp')
    setLoading(false)
  }

  async function verifyOTP() {
    if (otp.length < 6) return
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'email',
    })
    if (error) { setError(error.message); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles').select('onboarding_complete').eq('id', data.user.id).single()

    router.push(profile?.onboarding_complete ? '/dashboard' : '/onboarding')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left — branding */}
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

      {/* Right — auth form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 lg:p-16">
        <div className="max-w-md w-full mx-auto">

          {/* Mobile logo */}
          <div className="lg:hidden text-accent font-mono text-sm tracking-widest mb-10">ContentIQ</div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-ink mb-2">
              {step === 'email' ? 'Welcome' : 'Check your email'}
            </h2>
            <p className="text-muted text-sm">
              {step === 'email'
                ? 'Sign in or create your account — no password needed.'
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8">
            {step === 'email' ? (
              <>
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOTP()}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-ink text-sm font-mono outline-none focus:border-accent/60 transition-colors mb-4"
                  autoFocus
                />
                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
                <button
                  onClick={sendOTP}
                  disabled={loading || !email}
                  className="w-full bg-accent text-black font-bold tracking-widest text-xs uppercase py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Verification Code →'}
                </button>
              </>
            ) : (
              <>
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">6-Digit Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-4 text-ink text-2xl font-mono text-center outline-none focus:border-accent/60 transition-colors mb-4 tracking-[0.6em]"
                  maxLength={6}
                  autoFocus
                />
                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
                <button
                  onClick={verifyOTP}
                  disabled={loading || otp.length < 6}
                  className="w-full bg-accent text-black font-bold tracking-widest text-xs uppercase py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mb-3"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue →'}
                </button>
                <button
                  onClick={() => { setStep('email'); setOtp(''); setError('') }}
                  className="w-full text-muted text-xs hover:text-ink transition-colors py-1"
                >
                  ← Use a different email
                </button>
              </>
            )}
          </div>

          <p className="text-center text-muted text-xs mt-5">
            No password. No friction. Just a code to your inbox.
          </p>
        </div>
      </div>
    </div>
  )
}
