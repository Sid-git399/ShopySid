'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if ((event.nativeEvent as unknown as { isComposing?: boolean }).isComposing || (event as unknown as KeyboardEvent).keyCode === 229) return
    setError('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '')
    let result
    try {
      result = mode === 'sign-up'
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })
      setLoading(false)
      if (result.error) {
        setError('We could not complete that request. Check your details and try again.')
        return
      }
    } catch (error) {
      console.error('[v0] Authentication request failed', error)
      setLoading(false)
      setError('We could not complete that request. Check your details and try again.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'sign-up' && <input name="name" required placeholder="Your name" className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:ring-2 focus:ring-ring" />}
      <input name="email" type="email" required placeholder="Email address" className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:ring-2 focus:ring-ring" />
      <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:ring-2 focus:ring-ring" />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={loading} className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">{loading ? 'Please wait…' : mode === 'sign-up' ? 'Create workspace' : 'Sign in'}</button>
    </form>
  )
}
