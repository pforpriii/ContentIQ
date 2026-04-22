import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildUserContext(p) {
  if (!p) return ''
  return `
ABOUT THE USER (use this to personalize content ideas):
- Name: ${p.name || 'N/A'}
- Role: ${p.role || 'N/A'}
- Industry: ${p.industry || 'N/A'}
- Positioning: ${p.positioning || 'N/A'}
- Unique angle/POV: ${p.uniqueAngle || 'N/A'}
- Target audience: ${p.targetAudience || 'N/A'}
- Audience pain points: ${p.audiencePainPoints || 'N/A'}
- Tone/voice: ${p.tone || 'N/A'}
- Preferred formats: ${p.contentFormats?.join(', ') || 'N/A'}
- Past content sample: ${p.pastContent ? p.pastContent.slice(0, 500) + '...' : 'N/A'}
`.trim()
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { profiles } = await request.json()

    if (!profiles?.length) {
      return NextResponse.json({ error: 'No profiles provided' }, { status: 400 })
    }

    const userProfile = await prisma.profile.findUnique({ where: { userId: session.sub } })
    const userCtx = buildUserContext(userProfile)
    const profileList = profiles.map((p, i) => `${i + 1}. ${p}`).join('\n')

    const prompt = `You are a LinkedIn content strategist. Search the web for LinkedIn posts, articles, and activity for these creators:

${profileList}

${userCtx}

For each creator:
1. Search for their LinkedIn content and recent posts
2. Identify 5-8 main topics they write about
3. Note their content style and voice

Then generate 12 content ideas for the user (described above) that are:
- Inspired by topic patterns from the creators
- Tailored specifically to the user's industry, audience, and positioning
- Designed to build their personal brand AND generate leads/business
- Written in the user's preferred tone

Respond ONLY in valid JSON (no markdown, no preamble):
{
  "profiles": [
    {
      "name": "string",
      "topics": ["topic1", ...],
      "style": "string",
      "summary": "string"
    }
  ],
  "content_ideas": [
    {
      "title": "string",
      "hook": "string",
      "format": "string",
      "angle": "string"
    }
  ]
}`

    // First call with web search enabled
    let response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    })

    // If model used tools, continue until we get final text
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
    console.error('Analyze error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
