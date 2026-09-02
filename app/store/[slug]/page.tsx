import { notFound } from 'next/navigation'
import { getPublicStore } from '@/app/actions/commerce'
import { Storefront } from '@/components/storefront'

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getPublicStore(slug)
  if (!data) notFound()
  return <main className="min-h-screen bg-background text-foreground"><header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{data.store.name}</p><span className="text-sm text-muted-foreground">Independent goods, thoughtfully made.</span></div></header><section className="mx-auto max-w-6xl px-6 py-16"><p className="text-sm font-medium text-primary">The live collection</p><h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Objects for everyday rituals.</h1><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Browse the latest pieces from {data.store.name}. Each product is available while supplies last.</p><Storefront store={{ id: data.store.id, name: data.store.name }} products={data.products.map((product) => ({ id: product.id, name: product.name, category: product.category, priceCents: product.priceCents, stock: product.stock }))} /></section></main>
}
