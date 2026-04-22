'use client'
import { useState, type ReactElement, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, SavedIdea } from '@prisma/client'

type ProfileWithEmail = Profile & { email: string }

interface Idea {
  title: string
  hook?: string | null
  format?: string | null
  angle?: string | null
  source?: string | null
  tags?: string[]
}

interface CreatorBreakdown {
  name: string
  topics?: string[]
  style?: string
  summary?: string
}

interface AnalyzeResults {
  profiles?: CreatorBreakdown[]
  content_ideas?: Idea[]
}

interface ResearchResults {
  trend_summary?: string
  key_angles?: string[]
  content_ideas?: Idea[]
}

const Icon = {
  Creator: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Research: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Saved: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Profile: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  X: () => (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  Bookmark: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
    </svg>
  ),
  Logout: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

function Spinner() {
  return <div className="spinner" />
}

function Pill({ children, color = 'default' }: { children: ReactNode; color?: 'default' | 'accent' }) {
  const cls = color === 'accent'
    ? 'bg-accent/10 border-accent/30 text-accent'
    : 'bg-white/5 border-border text-muted'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs ${cls}`}>
      {children}
    </span>
  )
}

type TabId = 'creator' | 'research' | 'saved' | 'profile'

interface DashboardClientProps {
  profile: ProfileWithEmail
  initialSavedIdeas: SavedIdea[]
}

export default function DashboardClient({ profile, initialSavedIdeas }: DashboardClientProps) {
  const [tab, setTab]             = useState<TabId>('creator')
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(initialSavedIdeas)

  async function saveIdea(idea: Idea) {
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea),
    })
    if (res.ok) {
      const { idea: saved } = (await res.json()) as { idea: SavedIdea }
      setSavedIdeas(prev => [saved, ...prev])
    }
  }

  async function deleteIdea(id: string) {
    const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' })
    if (res.ok) setSavedIdeas(prev => prev.filter(i => i.id !== id))
  }

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.assign('/')
  }

  const TABS: { id: TabId; label: string; Icon: () => ReactElement }[] = [
    { id: 'creator',  label: 'Creator Analysis', Icon: Icon.Creator },
    { id: 'research', label: 'Topic Research',   Icon: Icon.Research },
    { id: 'saved',    label: `Saved Ideas (${savedIdeas.length})`, Icon: Icon.Saved },
    { id: 'profile',  label: 'My Profile',       Icon: Icon.Profile },
  ]

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card flex-shrink-0">
        <div className="p-5 border-b border-border">
          <div className="text-accent font-mono text-sm tracking-widest mb-0.5">ContentIQ</div>
          <div className="text-xs text-muted truncate">{profile.email}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                tab === t.id
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-muted hover:text-ink hover:bg-white/5'
              }`}
            >
              <t.Icon />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-ink font-medium truncate">{profile.name}</div>
            <div className="text-xs text-muted truncate">{profile.role}</div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <Icon.Logout /> Sign out
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <span className="text-accent font-mono text-sm tracking-widest">ContentIQ</span>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`p-2 rounded-lg transition-all ${tab === t.id ? 'text-accent' : 'text-muted'}`}
            >
              <t.Icon />
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <div className="max-w-3xl mx-auto p-6 lg:p-10">
          {tab === 'creator'  && <CreatorTab  profile={profile} onSave={saveIdea} />}
          {tab === 'research' && <ResearchTab profile={profile} onSave={saveIdea} />}
          {tab === 'saved'    && <SavedTab    ideas={savedIdeas} onDelete={deleteIdea} />}
          {tab === 'profile'  && <ProfileTab  profile={profile} />}
        </div>
      </main>
    </div>
  )
}

function CreatorTab({ profile, onSave }: { profile: ProfileWithEmail; onSave: (idea: Idea) => Promise<void> }) {
  const [input, setInput]       = useState('')
  const [profiles, setProfiles] = useState<string[]>(profile.favouriteCreators ?? [])
  const [loading, setLoading]   = useState(false)
  const [status, setStatus]     = useState('')
  const [results, setResults]   = useState<AnalyzeResults | null>(null)
  const [error, setError]       = useState('')
  const [saved, setSaved]       = useState<Set<string>>(new Set())

  function addProfile() {
    const v = input.trim()
    if (v && !profiles.includes(v)) { setProfiles(p => [...p, v]); setInput('') }
  }

  async function analyze() {
    if (!profiles.length) return
    setLoading(true); setError(''); setResults(null)
    try {
      setStatus('Researching LinkedIn content for each creator...')
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'API error')
      setResults(data)
      setStatus('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    }
    setLoading(false)
  }

  async function handleSave(idea: Idea) {
    await onSave({ ...idea, source: 'creator_analysis' })
    setSaved(s => new Set([...s, idea.title]))
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Creator Analysis</h1>
        <p className="text-muted text-sm">Add LinkedIn creators to analyze their content strategy and get personalized topic ideas.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <label className="block text-xs uppercase tracking-widest text-muted mb-2 font-mono">Add Profiles to Analyze</label>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-ink text-sm font-mono outline-none focus:border-accent/60 transition-colors"
            placeholder="Name or LinkedIn URL"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addProfile()}
          />
          <button onClick={addProfile} className="border border-border text-accent rounded-lg px-4 hover:bg-accent/10 transition-colors">
            <Icon.Plus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {profiles.map(p => (
            <span key={p} className="flex items-center gap-1.5 bg-bg border border-border rounded-full px-3 py-1 text-xs text-ink">
              {p.length > 35 ? p.slice(0, 35) + '…' : p}
              <button onClick={() => setProfiles(pr => pr.filter(x => x !== p))} className="text-red-400 hover:text-red-300"><Icon.X /></button>
            </span>
          ))}
        </div>

        <button
          onClick={analyze}
          disabled={loading || !profiles.length}
          className="w-full mt-4 bg-accent text-black font-bold tracking-widest text-xs uppercase py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : `Analyze ${profiles.length} Profile${profiles.length !== 1 ? 's' : ''} →`}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-muted text-sm p-4 bg-card border border-border rounded-xl mb-6">
          <Spinner /> {status}
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 mb-6">{error}</div>}

      {results && (
        <>
          <h2 className="font-display text-xl font-bold text-ink mb-4 mt-8">
            <span className="inline-block w-2 h-2 rounded-full bg-accent mr-2" />
            Profile Breakdown
          </h2>
          {results.profiles?.map((p, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 mb-4 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="font-display text-xl font-bold text-ink mb-1">{p.name}</div>
              <div className="text-muted text-sm mb-4 leading-relaxed">{p.summary}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.topics?.map((t, j) => <Pill key={j} color="accent">{t}</Pill>)}
              </div>
              <div className="text-xs text-muted font-mono">
                <span className="text-accent/70">STYLE — </span>{p.style}
              </div>
            </div>
          ))}

          <h2 className="font-display text-xl font-bold text-ink mb-4 mt-8">
            <span className="inline-block w-2 h-2 rounded-full bg-accent mr-2" />
            Your Personalized Content Ideas
          </h2>
          {results.content_ideas?.map((idea, i) => (
            <IdeaCard
              key={i}
              idea={idea}
              index={i}
              isSaved={saved.has(idea.title)}
              onSave={() => handleSave(idea)}
            />
          ))}
        </>
      )}
    </div>
  )
}

function ResearchTab({ profile: _profile, onSave }: { profile: ProfileWithEmail; onSave: (idea: Idea) => Promise<void> }) {
  const [query, setQuery]     = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus]   = useState('')
  const [results, setResults] = useState<ResearchResults | null>(null)
  const [error, setError]     = useState('')
  const [saved, setSaved]     = useState<Set<string>>(new Set())

  async function research() {
    if (!query.trim()) return
    setLoading(true); setError(''); setResults(null)
    setStatus('Scanning the web for trending topics and conversations...')
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'API error')
      setResults(data)
      setStatus('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    }
    setLoading(false)
  }

  async function handleSave(idea: Idea) {
    await onSave({ ...idea, source: 'research' })
    setSaved(s => new Set([...s, idea.title]))
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Topic Research</h1>
        <p className="text-muted text-sm">Enter a topic, keyword, or question. The AI will scan the web for trending conversations and turn them into content ideas for you.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <label className="block text-xs uppercase tracking-widest text-muted mb-2 font-mono">Research Topic / Keyword</label>
        <textarea
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-ink text-sm outline-none focus:border-accent/60 transition-colors font-sans resize-none leading-relaxed mb-4"
          placeholder={`Enter a topic, trend, or question you want to write about.\n\ne.g. "AI replacing sales teams", "how founders build trust on LinkedIn", "B2B demand gen in 2025"`}
          rows={3}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          onClick={research}
          disabled={loading || !query.trim()}
          className="w-full bg-accent text-black font-bold tracking-widest text-xs uppercase py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Researching...' : 'Research & Generate Ideas →'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-muted text-sm p-4 bg-card border border-border rounded-xl mb-6">
          <Spinner /> {status}
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 mb-6">{error}</div>}

      {results && (
        <>
          {results.trend_summary && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="text-xs uppercase tracking-widest text-muted font-mono mb-3">What&apos;s Trending Right Now</div>
              <p className="text-ink text-sm leading-relaxed">{results.trend_summary}</p>
              {results.key_angles && results.key_angles.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {results.key_angles.map((a, i) => <Pill key={i}>{a}</Pill>)}
                </div>
              )}
            </div>
          )}

          <h2 className="font-display text-xl font-bold text-ink mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-accent mr-2" />
            Content Ideas From Research
          </h2>
          {results.content_ideas?.map((idea, i) => (
            <IdeaCard
              key={i}
              idea={idea}
              index={i}
              isSaved={saved.has(idea.title)}
              onSave={() => handleSave(idea)}
            />
          ))}
        </>
      )}
    </div>
  )
}

function SavedTab({ ideas, onDelete }: { ideas: SavedIdea[]; onDelete: (id: string) => Promise<void> }) {
  if (!ideas.length) {
    return (
      <div className="animate-fade-up text-center py-20">
        <div className="text-5xl mb-4">🔖</div>
        <h2 className="font-display text-2xl text-ink mb-2">No saved ideas yet</h2>
        <p className="text-muted text-sm">Hit the bookmark icon on any idea to save it here.</p>
      </div>
    )
  }

  const bySource: Record<string, SavedIdea[]> = ideas.reduce<Record<string, SavedIdea[]>>((acc, idea) => {
    const key = idea.source || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(idea)
    return acc
  }, {})

  const labels: Record<string, string> = {
    creator_analysis: 'From Creator Analysis',
    research: 'From Topic Research',
    other: 'Saved Ideas',
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Saved Ideas</h1>
        <p className="text-muted text-sm">{ideas.length} idea{ideas.length !== 1 ? 's' : ''} saved.</p>
      </div>

      {Object.entries(bySource).map(([source, group]) => (
        <div key={source} className="mb-8">
          <div className="text-xs uppercase tracking-widest text-muted font-mono mb-4">{labels[source] || source}</div>
          {group.map(idea => (
            <div key={idea.id} className="bg-card border border-border rounded-xl p-5 mb-3 group">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="text-ink text-sm font-medium mb-2">{idea.title}</div>
                  {idea.hook && (
                    <div className="text-muted text-xs italic mb-2">&quot;{idea.hook}&quot;</div>
                  )}
                  {idea.angle && (
                    <div className="text-muted text-xs leading-relaxed">{idea.angle}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {idea.format && <Pill>{idea.format}</Pill>}
                  <button
                    onClick={() => onDelete(idea.id)}
                    className="text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Icon.Trash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ProfileTab({ profile }: { profile: ProfileWithEmail }) {
  const router = useRouter()
  const fields: { label: string; value: string | null | undefined }[] = [
    { label: 'Name',               value: profile.name },
    { label: 'Role',               value: profile.role },
    { label: 'Industry',           value: profile.industry },
    { label: 'Tone',               value: profile.tone },
    { label: 'Content Formats',    value: profile.contentFormats?.join(', ') },
    { label: 'Positioning',        value: profile.positioning },
    { label: 'Target Audience',    value: profile.targetAudience },
    { label: 'Favourite Creators', value: profile.favouriteCreators?.join(', ') },
  ]

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-2">My Profile</h1>
          <p className="text-muted text-sm">This context is used to personalize every analysis and idea.</p>
        </div>
        <button
          onClick={() => router.push('/onboarding')}
          className="text-xs text-accent border border-accent/30 px-4 py-2 rounded-lg hover:bg-accent/10 transition-colors"
        >
          Edit Profile
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {fields.map((f, i) => f.value ? (
          <div key={i} className="flex gap-6 px-6 py-4 border-b border-border last:border-0">
            <div className="text-xs uppercase tracking-widest text-muted font-mono w-36 flex-shrink-0 pt-0.5">{f.label}</div>
            <div className="text-ink text-sm leading-relaxed">{f.value}</div>
          </div>
        ) : null)}
      </div>

      {profile.pastContent && (
        <div className="mt-6 bg-card border border-border rounded-xl p-6">
          <div className="text-xs uppercase tracking-widest text-muted font-mono mb-3">Past Content Sample</div>
          <div className="text-muted text-xs leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {profile.pastContent.slice(0, 800)}{profile.pastContent.length > 800 ? '…' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

function IdeaCard({ idea, index, isSaved, onSave }: { idea: Idea; index: number; isSaved: boolean; onSave: () => void }) {
  return (
    <div
      className="bg-card border border-border hover:border-accent/30 rounded-xl p-5 mb-3 transition-colors animate-fade-up group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {idea.format && <Pill>{idea.format}</Pill>}
          </div>
          <div className="text-ink text-sm font-medium mb-2">{idea.title}</div>
          {idea.hook && (
            <div className="text-muted text-xs italic mb-2">
              <span className="text-accent/60 not-italic">Hook: </span>&quot;{idea.hook}&quot;
            </div>
          )}
          {idea.angle && (
            <div className="text-muted text-xs leading-relaxed">
              <span className="text-accent/60">Why it works: </span>{idea.angle}
            </div>
          )}
        </div>
        <button
          onClick={onSave}
          disabled={isSaved}
          className={`flex-shrink-0 p-2 rounded-lg border transition-all ${
            isSaved
              ? 'border-accent/30 text-accent bg-accent/10'
              : 'border-border text-muted hover:border-accent/30 hover:text-accent opacity-0 group-hover:opacity-100'
          }`}
          title={isSaved ? 'Saved' : 'Save idea'}
        >
          <Icon.Bookmark />
        </button>
      </div>
    </div>
  )
}
