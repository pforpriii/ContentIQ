'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STEPS = [
  { num: 1, title: 'The Basics',         sub: 'Who are you?' },
  { num: 2, title: 'Your Story',         sub: 'Background & experience' },
  { num: 3, title: 'Positioning',        sub: 'What you stand for' },
  { num: 4, title: 'Your Audience',      sub: 'Who you\'re writing for' },
  { num: 5, title: 'Content Style',      sub: 'How you want to show up' },
  { num: 6, title: 'Past Content',       sub: 'Help us learn your voice' },
  { num: 7, title: 'Creator Inspiration', sub: 'Who do you learn from' },
]

const TONES = [
  'Professional & authoritative',
  'Conversational & warm',
  'Bold & provocative',
  'Educational & clear',
  'Storytelling & narrative',
  'Analytical & data-driven',
]

const FORMATS = [
  'Personal stories', 'How-to posts', 'Opinion pieces',
  'Industry insights', 'Case studies', 'Lists & tips',
  'Research threads', 'Behind the scenes',
]

export default function OnboardingPage() {
  const [step, setStep]     = useState(1)
  const [saving, setSaving] = useState(false)
  const [creatorInput, setCreatorInput] = useState('')
  const [form, setForm] = useState({
    name: '', role: '', industry: '',
    bio: '', experience: '',
    positioning: '', unique_angle: '',
    target_audience: '', audience_pain_points: '',
    tone: '', content_formats: [],
    past_content: '',
    favourite_creators: [],
  })
  const supabase = createClient()
  const router   = useRouter()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleFmt = f => set('content_formats',
    form.content_formats.includes(f)
      ? form.content_formats.filter(x => x !== f)
      : [...form.content_formats, f]
  )
  const addCreator = () => {
    const v = creatorInput.trim()
    if (v && !form.favourite_creators.includes(v)) {
      set('favourite_creators', [...form.favourite_creators, v])
      setCreatorInput('')
    }
  }

  const canContinue = () => {
    if (step === 1) return form.name && form.role && form.industry
    return true
  }

  async function finish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      ...form,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })
    if (!error) router.push('/dashboard')
    else { alert('Error saving. Please try again.'); setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-xs text-muted font-mono">
            <span>Step {step} of {STEPS.length}</span>
            <span>{Math.round((step / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-0.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
          {/* Step labels */}
          <div className="flex mt-3 gap-1">
            {STEPS.map(s => (
              <div
                key={s.num}
                className={`flex-1 h-0.5 rounded-full transition-all ${step >= s.num ? 'bg-accent/40' : 'bg-border'}`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 animate-fade-up" key={step}>
          <div className="mb-6">
            <p className="text-accent text-xs tracking-widest uppercase font-mono mb-1">{STEPS[step-1].sub}</p>
            <h2 className="font-display text-3xl font-bold text-ink">{STEPS[step-1].title}</h2>
          </div>

          {/* ── Step 1: Basics ── */}
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Your Name" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Priya Sharma" />
              <Field label="Role / Title" value={form.role} onChange={v => set('role', v)} placeholder="e.g. Founder, Marketing Consultant, Sales Coach" />
              <Field label="Industry / Niche" value={form.industry} onChange={v => set('industry', v)} placeholder="e.g. B2B SaaS, Real Estate, Executive Coaching" />
            </div>
          )}

          {/* ── Step 2: Story ── */}
          {step === 2 && (
            <div className="space-y-4">
              <TA
                label="Professional Background"
                value={form.bio}
                onChange={v => set('bio', v)}
                placeholder="Describe your professional journey — roles, companies, pivotal moments, how you got to where you are today..."
                rows={4}
              />
              <TA
                label="Your Expertise & Experience"
                value={form.experience}
                onChange={v => set('experience', v)}
                placeholder="What do you know deeply? What have you done that most people in your field haven't? Awards, results, numbers if you have them."
                rows={4}
              />
            </div>
          )}

          {/* ── Step 3: Positioning ── */}
          {step === 3 && (
            <div className="space-y-4">
              <TA
                label="Your Positioning Statement"
                value={form.positioning}
                onChange={v => set('positioning', v)}
                placeholder="How do you explain what you do? e.g. 'I help Series A founders build GTM motions that don't rely on paid ads...'"
                rows={3}
              />
              <TA
                label="Your Unique Point of View"
                value={form.unique_angle}
                onChange={v => set('unique_angle', v)}
                placeholder="What do you believe that others in your industry don't? What's your contrarian take? What makes you different?"
                rows={3}
              />
            </div>
          )}

          {/* ── Step 4: Audience ── */}
          {step === 4 && (
            <div className="space-y-4">
              <TA
                label="Who Is Your Ideal Audience?"
                value={form.target_audience}
                onChange={v => set('target_audience', v)}
                placeholder="Describe them: their role, company stage, experience level, what they're working on, what they aspire to..."
                rows={3}
              />
              <TA
                label="Their Biggest Pain Points & Questions"
                value={form.audience_pain_points}
                onChange={v => set('audience_pain_points', v)}
                placeholder="What problems keep them up at night? What do they ask you most? What frustrates them about your industry?"
                rows={3}
              />
            </div>
          )}

          {/* ── Step 5: Style ── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-3 font-mono">Tone & Voice — Pick One</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button
                      key={t}
                      onClick={() => set('tone', t)}
                      className={`text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 ${
                        form.tone === t
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-bg text-muted hover:border-accent/30 hover:text-ink'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-3 font-mono">Preferred Content Formats</label>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map(f => (
                    <button
                      key={f}
                      onClick={() => toggleFmt(f)}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-all duration-150 ${
                        form.content_formats.includes(f)
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted hover:border-accent/30 hover:text-ink'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Past Content ── */}
          {step === 6 && (
            <div className="space-y-3">
              <TA
                label="Paste Your Content, Transcripts, or Writing Samples"
                value={form.past_content}
                onChange={v => set('past_content', v)}
                placeholder={`Paste anything that shows how you think and write:\n\n• LinkedIn posts you've written\n• Newsletter emails\n• Podcast/talk transcripts\n• Blog posts or articles\n• Even voice-note transcriptions\n\nThe more you add, the better the AI will understand your natural voice.`}
                rows={12}
              />
              <p className="text-xs text-muted">
                Private to your account. Used only to calibrate tone and topic suggestions for you.
              </p>
            </div>
          )}

          {/* ── Step 7: Creators ── */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-2 font-mono">Add Creators You Admire</label>
                <p className="text-muted text-xs mb-4">Names or LinkedIn URLs. The tool will analyze their content strategy to inspire yours.</p>
                <div className="flex gap-2 mb-4">
                  <input
                    className="flex-1 bg-bg border border-border rounded-lg px-4 py-3 text-ink text-sm font-mono outline-none focus:border-accent/60 transition-colors"
                    placeholder="e.g. Gary Vaynerchuk or linkedin.com/in/..."
                    value={creatorInput}
                    onChange={e => setCreatorInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCreator()}
                  />
                  <button
                    onClick={addCreator}
                    className="border border-border text-accent rounded-lg px-5 hover:bg-accent/10 transition-colors text-xl font-light"
                  >+</button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {form.favourite_creators.length === 0 && (
                    <span className="text-xs text-muted">No creators added yet — you can skip this and add from the dashboard.</span>
                  )}
                  {form.favourite_creators.map(c => (
                    <span key={c} className="flex items-center gap-1.5 bg-bg border border-border rounded-full px-3 py-1 text-xs text-ink">
                      {c.length > 35 ? c.slice(0, 35) + '…' : c}
                      <button
                        onClick={() => set('favourite_creators', form.favourite_creators.filter(x => x !== c))}
                        className="text-red-400 hover:text-red-300 transition-colors ml-0.5"
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-border text-muted hover:text-ink hover:border-accent/30 py-3.5 rounded-lg text-sm transition-all"
              >
                ← Back
              </button>
            )}
            {step < STEPS.length ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canContinue()}
                className="flex-1 bg-accent text-black font-bold tracking-widest text-xs uppercase py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 bg-accent text-black font-bold tracking-widest text-xs uppercase py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Setting up your dashboard...' : 'Launch My Dashboard →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted mb-2 font-mono">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-ink text-sm outline-none focus:border-accent/60 transition-colors font-sans"
      />
    </div>
  )
}

function TA({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted mb-2 font-mono">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-ink text-sm outline-none focus:border-accent/60 transition-colors font-sans resize-none leading-relaxed"
      />
    </div>
  )
}
