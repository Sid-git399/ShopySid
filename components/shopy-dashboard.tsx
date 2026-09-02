'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { createCustomer, createOrder, createProduct, updateStoreSettings } from '@/app/actions/commerce'
import {
  ArrowUpRight,
  Bot,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Orders', icon: ShoppingCart, count: '12' },
  { label: 'Products', icon: Package },
  { label: 'Customers', icon: Users },
]

const products = [
  { name: 'Canvas Weekender', category: 'Travel goods', price: '$128.00', stock: 42, status: 'Active', tone: 'sand' },
  { name: 'Everyday Tote', category: 'Bags', price: '$74.00', stock: 18, status: 'Active', tone: 'blue' },
  { name: 'Studio Mug Set', category: 'Home', price: '$36.00', stock: 0, status: 'Draft', tone: 'clay' },
]
type Product = (typeof products)[number]
type Customer = { name: string; email: string; orders: number; spent: string }
type Order = { id: string; customer: string; item: string; amount: string; status: string; time: string }

const orders = [
  { id: '#1048', customer: 'Maya Chen', item: 'Canvas Weekender', amount: '$128.00', status: 'Paid', time: '2 min ago' },
  { id: '#1047', customer: 'Jon Bell', item: 'Everyday Tote', amount: '$74.00', status: 'Fulfilled', time: '38 min ago' },
  { id: '#1046', customer: 'Noah Williams', item: 'Studio Mug Set', amount: '$36.00', status: 'Paid', time: '1 hr ago' },
  { id: '#1045', customer: 'Ava Patel', item: 'Canvas Weekender', amount: '$128.00', status: 'Pending', time: '3 hrs ago' },
]

export function ShopyDashboard({ userName = 'there', storeSlug, totalSalesCents = 0, salesByDay = [], initialProducts = products, initialCustomers = [], initialOrders = [] }: { userName?: string; storeSlug?: string; totalSalesCents?: number; salesByDay?: number[]; initialProducts?: Product[]; initialCustomers?: Customer[]; initialOrders?: Order[] }) {
  const router = useRouter()
  const [active, setActive] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [lastSynced, setLastSynced] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [productOpen, setProductOpen] = useState(false)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productStock, setProductStock] = useState('')
  const [assistantPrompt, setAssistantPrompt] = useState('')
  const [assistantAnswer, setAssistantAnswer] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [catalog, setCatalog] = useState<Product[]>(initialProducts)
  const [audience, setAudience] = useState<Customer[]>(initialCustomers)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderCustomer, setOrderCustomer] = useState('')
  const [orderEmail, setOrderEmail] = useState('')
  const [orderTotal, setOrderTotal] = useState('')
  const [orderList, setOrderList] = useState<Order[]>(initialOrders)

  useEffect(() => {
    const formatDate = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, options).format(new Date())
    setCurrentDate(formatDate({ dateStyle: 'full' }))
    setLastSynced(formatDate({ dateStyle: 'medium', timeStyle: 'short' }))
  }, [])

  const filteredProducts = useMemo(() => catalog.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())), [catalog, query])

  function showToast(message: string) {
    setToast(message)
    setLastSynced(new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))
    window.setTimeout(() => setToast(''), 2400)
  }

  async function askAssistant() {
    if (!assistantPrompt.trim() || assistantLoading) return
    setAssistantLoading(true)
    setAssistantAnswer('')
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: assistantPrompt }) })
      const data = await response.json()
      setAssistantAnswer(data.answer ?? data.error ?? 'Sid could not answer that.')
    } catch {
      setAssistantAnswer('Sid is temporarily unavailable. Please try again shortly.')
    } finally {
      setAssistantLoading(false)
    }
  }

  async function saveOrder(event: React.FormEvent) {
    event.preventDefault()
    try {
      const result = await createOrder({ customerName: orderCustomer, customerEmail: orderEmail, total: Number(orderTotal) })
      setOrderList((current) => [{ id: result.id, customer: orderCustomer.trim(), item: 'Manual order', amount: `$${Number(orderTotal).toFixed(2)}`, status: 'Pending', time: 'Just now' }, ...current])
      setOrderOpen(false); setOrderCustomer(''); setOrderEmail(''); setOrderTotal(''); showToast('Order created')
    } catch { showToast('Could not create order. Check the details and try again.') }
  }

  async function saveCustomer(event: React.FormEvent) {
    event.preventDefault()
    try {
      await createCustomer({ name: customerName, email: customerEmail })
      setAudience((current) => [{ name: customerName.trim(), email: customerEmail.trim().toLowerCase(), orders: 0, spent: '$0.00' }, ...current])
      setCustomerOpen(false); setCustomerName(''); setCustomerEmail(''); showToast('Customer added')
    } catch { showToast('Could not add customer. Check the email or try again.') }
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault()
    if (!productName.trim() || !productPrice || !productStock) return
    try {
      await createProduct({ name: productName, price: Number(productPrice), stock: Number(productStock) })
      setCatalog((current) => [{ name: productName.trim(), category: 'General', price: `$${Number(productPrice).toFixed(2)}`, stock: Number(productStock), status: 'Active', tone: 'blue' }, ...current])
      setProductOpen(false)
      showToast(`${productName} saved to your catalog`)
      setProductName(''); setProductPrice(''); setProductStock('')
    } catch (error) {
      console.error('[v0] Product creation failed', error)
      showToast('Could not save product. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card px-5 py-6 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <button type="button" onClick={() => { setActive('Overview'); setMobileOpen(false) }} className="flex items-center gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Go to overview">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShoppingBag className="size-4" /></span>
            <span className="text-lg font-semibold tracking-tight">ShopySid</span>
          </button>
          <button className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="size-4" /></button>
        </div>

        <div className="mt-10 flex flex-1 flex-col">
          <p className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon
              const selected = active === item.label
              return <button key={item.label} onClick={() => { setActive(item.label); setMobileOpen(false) }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${selected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><span className="flex items-center gap-3"><Icon className="size-[17px]" />{item.label}</span>{item.count && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${selected ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{item.count}</span>}</button>
            })}
          </nav>
          <p className="mt-9 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Manage</p>
          <nav className="mt-3 space-y-1">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setAssistantOpen(true)}><Bot className="size-[17px]" />Sid AI <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">Beta</span></button>
            <button onClick={() => { setActive('Settings'); setMobileOpen(false) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active === 'Settings' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Settings2 className="size-[17px]" />Settings</button>
          </nav>
          <div className="mt-auto rounded-xl border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between"><span className="text-xs font-medium">Your store</span><span className="flex items-center gap-1.5 text-[10px] text-emerald-600"><span className="size-1.5 rounded-full bg-emerald-500" />Live</span></div>
            <p className="mt-2 truncate text-sm font-semibold">northstar.shopysid.store</p>
            <button onClick={() => storeSlug && window.open(`/store/${storeSlug}`, '_blank', 'noopener,noreferrer')} className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">View storefront <ExternalLink className="size-3" /></button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 sm:px-8">
          <div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></button><div><p className="text-xs text-muted-foreground">{currentDate}</p><p className="text-sm font-medium">Good morning, {userName.split(' ')[0]}</p></div></div><p className="hidden text-xs text-muted-foreground md:block">Synced {lastSynced}</p>
          <div className="flex items-center gap-2"><button onClick={() => setAssistantOpen(true)} className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted sm:flex"><Sparkles className="size-4 text-primary" /> Ask Sid</button><div className="relative"><button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-sm font-medium hover:bg-muted" aria-label="Open profile menu" aria-expanded={profileOpen}><span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{userName.slice(0, 1).toUpperCase()}</span><span className="hidden max-w-28 truncate sm:inline">{userName}</span><ChevronDown className={`hidden size-4 transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} /></button>{profileOpen && <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-border bg-card p-2 shadow-xl"><div className="border-b border-border px-3 pb-2"><p className="truncate text-sm font-semibold">{userName}</p><p className="text-xs text-muted-foreground">Store owner</p></div><button onClick={async () => { setProfileOpen(false); await signOut(); router.push('/sign-in'); router.refresh() }} className="mt-2 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-muted">Log out</button></div>}</div></div>
        </header>

        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
          {active !== 'Overview' ? <SectionView active={active} customers={audience} orders={orderList} onAdd={() => active === 'Products' ? setProductOpen(true) : active === 'Customers' ? setCustomerOpen(true) : active === 'Orders' ? setOrderOpen(true) : showToast(`${active.slice(0, -1)} creation flow ready`)} /> : <>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Overview</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">Your store at a glance.</h1><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Keep an eye on what is selling, what needs attention, and where your next opportunity is.</p></div><button onClick={() => setProductOpen(true)} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"><Plus className="size-4" /> Add product</button></div>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Store metrics">
              <MetricCard label="Total sales" value={`$${(totalSalesCents / 100).toFixed(2)}`} change="Live" icon={<TrendingUp className="size-4" />} /><MetricCard label="Orders" value={String(orderList.length)} change="Live" icon={<ShoppingCart className="size-4" />} /><MetricCard label="Customers" value={String(audience.length)} change="Live" icon={<Users className="size-4" />} /><MetricCard label="Conversion rate" value="—" change="Needs traffic data" icon={<ArrowUpRight className="size-4" />} />
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              <section className="rounded-xl border border-border bg-card p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Sales overview</h2><p className="mt-1 text-xs text-muted-foreground">Revenue performance over the last 30 days</p></div><button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">Last 30 days <ChevronDown className="size-3" /></button></div><div className="mt-7 flex items-end gap-2"><span className="text-2xl font-semibold">${(totalSalesCents / 100).toFixed(2)}</span><span className="mb-1 text-xs font-medium text-muted-foreground">Live data</span></div><SalesChart values={salesByDay} /></section>
              <section className="rounded-xl border border-border bg-primary p-5 text-primary-foreground sm:p-6"><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/10"><Sparkles className="size-4" /></div><span className="text-sm font-medium">Sid AI</span><span className="rounded-full bg-primary-foreground/10 px-2 py-0.5 text-[10px]">Beta</span></div><h2 className="mt-6 max-w-xs text-xl font-semibold leading-7 text-balance">What can I help you improve today?</h2><p className="mt-2 max-w-sm text-sm leading-6 text-primary-foreground/65">Ask about your store, products, customers, or get an idea for your next campaign.</p><div className="mt-6 flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-2.5"><Search className="size-4 text-primary-foreground/55" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setAssistantOpen(true) }} placeholder="Ask Sid anything..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-primary-foreground/45" /><button onClick={() => setAssistantOpen(true)} className="rounded-md bg-primary-foreground px-2.5 py-1.5 text-xs font-semibold text-primary hover:opacity-90">Ask</button></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setAssistantOpen(true)} className="rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs text-primary-foreground/75 hover:bg-primary-foreground/15">Best sellers?</button><button onClick={() => setAssistantOpen(true)} className="rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs text-primary-foreground/75 hover:bg-primary-foreground/15">Low stock</button></div></section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.35fr]">
              <section className="rounded-xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Top products</h2><p className="mt-1 text-xs text-muted-foreground">Best performers this month</p></div><button onClick={() => setActive('Products')} className="text-xs font-medium text-primary hover:underline">View all</button></div><div className="mt-5 space-y-4">{filteredProducts.map((product, index) => <div key={product.name} className="flex items-center gap-3"><div className={`flex size-10 items-center justify-center rounded-lg text-xs font-semibold ${product.tone === 'sand' ? 'bg-accent text-accent-foreground' : product.tone === 'blue' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>0{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{product.category}</p></div><div className="text-right"><p className="text-sm font-medium">{product.price}</p><p className={`mt-0.5 text-xs ${product.stock === 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}</p></div></div>)}</div></section>
              <section className="rounded-xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Recent orders</h2><p className="mt-1 text-xs text-muted-foreground">The latest activity in your store</p></div><button onClick={() => setActive('Orders')} className="text-xs font-medium text-primary hover:underline">View all</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y divide-border">{orderList.map((order) => <tr key={order.id}><td className="py-3.5 font-medium">{order.id}<p className="mt-0.5 text-xs font-normal text-muted-foreground">{order.time}</p></td><td className="py-3.5"><p>{order.customer}</p><p className="mt-0.5 text-xs text-muted-foreground">{order.item}</p></td><td className="py-3.5">{order.amount}</td><td className="py-3.5 text-right"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${order.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : order.status === 'Fulfilled' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600'}`}>{order.status}</span></td></tr>)}</tbody></table></div></section>
            </div>
          </>}
        </main>
      </div>

      {productOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4" onClick={() => setProductOpen(false)}><form onSubmit={saveProduct} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Add product</h2><p className="mt-1 text-sm text-muted-foreground">Create an item for your catalog.</p></div><button type="button" onClick={() => setProductOpen(false)} className="rounded-md p-2 hover:bg-muted" aria-label="Close product dialog"><X className="size-4" /></button></div><div className="mt-6 space-y-4"><label className="block text-sm font-medium">Product name<input value={productName} onChange={(event) => setProductName(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Linen Overshirt" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Price<input type="number" min="0" step="0.01" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="49.00" /></label><label className="block text-sm font-medium">Stock<input type="number" min="0" value={productStock} onChange={(event) => setProductStock(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="20" /></label></div></div><button type="submit" className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Save product</button></form></div>}

      {orderOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4" onClick={() => setOrderOpen(false)}><form onSubmit={saveOrder} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold">Create order</h2><p className="mt-1 text-sm text-muted-foreground">Record a manual order for your store.</p><div className="mt-6 space-y-4"><label className="block text-sm font-medium">Customer name<input value={orderCustomer} onChange={(event) => setOrderCustomer(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" /></label><label className="block text-sm font-medium">Customer email<input type="email" value={orderEmail} onChange={(event) => setOrderEmail(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" /></label><label className="block text-sm font-medium">Total<input type="number" min="0.01" step="0.01" value={orderTotal} onChange={(event) => setOrderTotal(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" /></label></div><button type="submit" className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Create order</button></form></div>}{customerOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4" onClick={() => setCustomerOpen(false)}><form onSubmit={saveCustomer} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold">Add customer</h2><p className="mt-1 text-sm text-muted-foreground">Save a contact to your store audience.</p><div className="mt-6 space-y-4"><label className="block text-sm font-medium">Name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" /></label><label className="block text-sm font-medium">Email<input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" /></label></div><button type="submit" className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Save customer</button></form></div>}

      {assistantOpen && <div className="fixed inset-0 z-50 flex items-end justify-end bg-foreground/20 p-4 sm:items-center sm:p-8" onClick={() => setAssistantOpen(false)}><div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bot className="size-4" /></div><div><p className="text-sm font-semibold">Sid AI</p><p className="text-xs text-muted-foreground">Your store assistant</p></div></div><button onClick={() => setAssistantOpen(false)} className="rounded-md p-2 hover:bg-muted" aria-label="Close assistant"><X className="size-4" /></button></div><div className="mt-6 rounded-xl bg-muted p-4"><p className="text-sm leading-6">Your best opportunity right now is the <strong>Everyday Tote</strong>. It has a 42% repeat-purchase rate and is trending up. Consider featuring it in your next email campaign.</p></div><div className="mt-4 flex gap-2"><button onClick={() => showToast('Campaign draft created')} className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground">Draft campaign</button><button onClick={() => showToast('Product insights opened')} className="flex-1 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold hover:bg-muted">Show insights</button></div><div className="mt-5 flex items-center gap-2 rounded-lg border border-border px-3 py-2.5"><input value={assistantPrompt} onChange={(event) => setAssistantPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) askAssistant() }} autoFocus placeholder="Ask a follow-up..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button onClick={askAssistant} disabled={assistantLoading} className="text-xs font-semibold text-primary disabled:opacity-50">{assistantLoading ? 'Thinking...' : 'Send'}</button></div>{assistantAnswer && <div className="mt-3 rounded-lg border border-border bg-background p-3 text-sm leading-6">{assistantAnswer}</div>}</div></div>}
      {toast && <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">{toast}</div>}
    </div>
  )
}

function MetricCard({ label, value, change, icon }: { label: string; value: string; change: string; icon: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="text-primary">{icon}</span></div><div className="mt-5 flex items-end gap-2"><p className="text-2xl font-semibold tracking-tight">{value}</p><span className="mb-1 flex items-center text-xs font-medium text-emerald-600">+{change}</span></div><p className="mt-1 text-xs text-muted-foreground">vs. previous period</p></div>
}

function SalesChart({ values }: { values: number[] }) {
  const source = values.length ? values : Array(30).fill(0)
  const max = Math.max(...source, 1)
  return <div className="mt-5 h-40 w-full"><div className="flex h-full items-end gap-1.5 sm:gap-2">{source.map((value, index) => { const height = value ? Math.max((value / max) * 100, 8) : 4; return <div key={index} className={`flex-1 rounded-t-sm ${index > 24 ? 'bg-primary' : 'bg-primary/15'}`} style={{ height: `${height}%` }} />})}</div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>30 days ago</span><span>3 weeks ago</span><span>2 weeks ago</span><span>1 week ago</span><span>Today</span></div></div>
}

function SectionView({ active, onAdd, customers, orders: orderRows }: { active: string; onAdd: () => void; customers: Customer[]; orders: Order[] }) {
  const [storeName, setStoreName] = useState('Northstar Goods')
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)
  async function saveSettings(event: React.FormEvent) { event.preventDefault(); setSaving(true); try { await updateStoreSettings({ name: storeName, currency }); alert('Settings saved') } catch { alert('Could not save settings') } finally { setSaving(false) } }
  return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Manage</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{active}</h1><p className="mt-2 text-sm text-muted-foreground">Keep your {active.toLowerCase()} organized and moving forward.</p></div><button onClick={onAdd} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"><Plus className="size-4" /> Add {active === 'Products' ? 'product' : active === 'Customers' ? 'customer' : 'order'}</button></div>{active === 'Orders' ? <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Order</th><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y divide-border">{orderRows.map((order) => <tr key={order.id}><td className="px-5 py-4 font-medium">{order.id}<p className="mt-1 text-xs font-normal text-muted-foreground">{order.time}</p></td><td className="px-5 py-4">{order.customer}</td><td className="px-5 py-4">{order.amount}</td><td className="px-5 py-4 text-right"><span className="rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600">{order.status}</span></td></tr>)}</tbody></table>{orderRows.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No orders yet. Create your first manual order.</p>}</div> : active === 'Settings' ? <form onSubmit={saveSettings} className="mt-8 max-w-2xl space-y-5 rounded-xl border border-border bg-card p-6"><div><h2 className="font-semibold">Store settings</h2><p className="mt-1 text-sm text-muted-foreground">Update the details customers see in your storefront.</p></div><label className="block text-sm font-medium">Store name<input value={storeName} onChange={(event) => setStoreName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" /></label><label className="block text-sm font-medium">Currency<input value={currency} onChange={(event) => setCurrency(event.target.value)} maxLength={3} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm uppercase outline-none" /></label><button disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? 'Saving...' : 'Save settings'}</button></form> : active === 'Customers' ? <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Orders</th><th className="px-5 py-3 text-right font-medium">Spent</th></tr></thead><tbody className="divide-y divide-border">{customers.map((customer) => <tr key={customer.email}><td className="px-5 py-4"><p className="font-medium">{customer.name}</p><p className="mt-1 text-xs text-muted-foreground">{customer.email}</p></td><td className="px-5 py-4">{customer.orders}</td><td className="px-5 py-4 text-right">{customer.spent}</td></tr>)}</tbody></table>{customers.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No customers yet. Add your first customer to start building your audience.</p>}</div> : <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted"><CircleHelp className="size-5 text-muted-foreground" /></div><h2 className="mt-4 font-semibold">{active} workspace</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">This workspace is connected to your live Neon data.</p></div>}</div>
}
