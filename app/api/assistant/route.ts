import { generateText } from 'ai'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 1000) : ''
  if (!prompt) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
  try {
    const { text } = await generateText({ model: 'openai/gpt-4o-mini', prompt: `You are Sid, a concise ecommerce assistant for ShopySid. Help a merchant with this request: ${prompt}` })
    return NextResponse.json({ answer: text })
  } catch (error) {
    console.error('[v0] Assistant request failed', error)
    return NextResponse.json({ answer: 'Sid is temporarily unavailable. Please try again shortly.' })
  }
}
