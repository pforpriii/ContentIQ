import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildUserContext(p) {
  if (!p) return ''
  return `
ABOUT THE USER:
- Name: ${p.name || 'N/A'}
- Role: ${p.role || 'N/A'}
- Industry: ${p.industry || 'N/A'}
- Positioning: ${p.positioning || 'N/A'}
- Target audience: ${p.targetAudience || 'N/A'}
- Audience pain points: ${p.audiencePainPoints || 'N/A'}
- Tone/voice: ${p.tone || 'N/A'}
- Preferred formats: ${p.contentFormats?.join(', ') || 'N/A'}
`.trim()
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { query } = await request.json()

    if (!query?.trim()) {
      return NextResponse.json({ error: 'No query provided' }, { status: 400 })
    }

    const userProfile = await prisma.profile.findUnique({ where: { userId: session.sub } })
    const userCtx = buildUserContext(userProfile)

    const prompt = `You are a LinkedIn content researcher. Search the web for current news, trends, debates, and conversations around this topic:

"${query}"

Look for:
- Recent articles, posts, and debates (last 3-6 months)
- Contrarian or surprising angles
- Data/statistics that would make compelling content
- Questions people are asking around this topic
- What thought leaders are saying

${userCtx}

Based on your research, generate 12 content ideas for the user above that:
- Are grounded in what's actually trending RIGHT NOW
- Are tailored to their industry and audience
- Mix different angles (contrarian, educational, story-based, data-driven)
- Include research-heavy ideas that would establish authority

Respond ONLY in valid JSON (no markdown, no preamble):
{
  "trend_summary": "2-3 sentences describing what's currently happening around this topic",
  "key_angles": ["angle1", "angle2", "angle3", "angle4"],
  "content_ideas": [
    {
      "title": "string",
      "hook": "string",
      "format": "string",
      "angle": "string — why this is timely and relevant right now"
    }
  ]
}`

    let response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    })

    const messages = [{ role: 'user', content: prompt }]
    while (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content })
      const toolResults = response.content
        .filter(b => b.type === 'tool_use')
        .map(b => ({ type: 'tool_result', tool_use_id: b.id, content: 'Search completed' }))
      messages.push({ role: 'user', content: toolResults })
      response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      })
    }

    const rawText = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    const clean   = rawText.replace(/```json|```/g, '').trim()
    const start   = clean.indexOf('{')
    const end     = clean.lastIndexOf('}')
    const parsed  = JSON.parse(clean.slice(start, end + 1))

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Research error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
