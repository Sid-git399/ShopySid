import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">ShopySid</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your store workspace.</p>
        </div>
        <AuthForm mode="sign-in" />
        <p className="text-center text-sm text-muted-foreground">New to ShopySid? <Link className="font-semibold text-primary hover:underline" href="/sign-up">Create an account</Link></p>
      </section>
    </main>
  )
}
