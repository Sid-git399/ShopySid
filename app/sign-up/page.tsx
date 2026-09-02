import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">ShopySid</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Create your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start managing your store in one focused workspace.</p>
        </div>
        <AuthForm mode="sign-up" />
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link className="font-semibold text-primary hover:underline" href="/sign-in">Sign in</Link></p>
      </section>
    </main>
  )
}
