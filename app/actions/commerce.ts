'use server'

import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { customers, orders, products, stores } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getStore(userId: string) {
  const existing = await db.select().from(stores).where(eq(stores.userId, userId)).limit(1)
  if (existing[0]) return existing[0]
  const id = crypto.randomUUID()
  const created = await db.insert(stores).values({ id, userId, name: 'Northstar Goods', slug: `northstar-${id.slice(0, 8)}` }).returning()
  return created[0]
}

export async function getDashboardData() {
  const userId = await getUserId()
  const store = await getStore(userId)
  const catalog = await db.select().from(products).where(and(eq(products.userId, userId), eq(products.storeId, store.id))).orderBy(desc(products.createdAt))
  const audience = await db.select().from(customers).where(and(eq(customers.userId, userId), eq(customers.storeId, store.id))).orderBy(desc(customers.createdAt))
  const recentOrders = await db.select().from(orders).where(and(eq(orders.userId, userId), eq(orders.storeId, store.id))).orderBy(desc(orders.createdAt)).limit(50)
  return { store, products: catalog, customers: audience, orders: recentOrders }
}

export async function createCustomer(input: { name: string; email: string }) {
  const userId = await getUserId()
  const store = await getStore(userId)
  const name = input.name.trim().slice(0, 120)
  const email = input.email.trim().toLowerCase().slice(0, 254)
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Invalid customer details')
  const existing = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.userId, userId), eq(customers.email, email))).limit(1)
  if (existing[0]) throw new Error('Customer already exists')
  await db.insert(customers).values({ id: crypto.randomUUID(), userId, storeId: store.id, name, email })
  revalidatePath('/')
  return { ok: true }
}

export async function createOrder(input: { customerName: string; customerEmail: string; total: number }) {
  const userId = await getUserId()
  const store = await getStore(userId)
  const customerName = input.customerName.trim().slice(0, 120)
  const customerEmail = input.customerEmail.trim().toLowerCase().slice(0, 254)
  const totalCents = Math.round(Number(input.total) * 100)
  if (!customerName || !/^\S+@\S+\.\S+$/.test(customerEmail) || !Number.isInteger(totalCents) || totalCents <= 0) throw new Error('Invalid order details')
  const id = `ORD-${Date.now().toString(36).toUpperCase()}`
  await db.insert(orders).values({ id, userId, storeId: store.id, customerName, customerEmail, totalCents, status: 'pending' })
  revalidatePath('/')
  return { id }
}

export async function updateStoreSettings(input: { name: string; currency: string }) {
  const userId = await getUserId()
  const name = input.name.trim().slice(0, 120)
  const currency = input.currency.trim().toUpperCase().slice(0, 3)
  if (!name || !/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid store settings')
  const store = await getStore(userId)
  await db.update(stores).set({ name, currency }).where(and(eq(stores.id, store.id), eq(stores.userId, userId)))
  revalidatePath('/')
  revalidatePath(`/store/${store.slug}`)
  return { ok: true }
}

export async function createStoreOrder(input: { storeId: string; customerName: string; customerEmail: string; totalCents: number }) {
  const name = input.customerName.trim().slice(0, 120)
  const email = input.customerEmail.trim().toLowerCase().slice(0, 254)
  const totalCents = Number(input.totalCents)
  if (!input.storeId || !name || !/^\S+@\S+\.\S+$/.test(email) || !Number.isInteger(totalCents) || totalCents <= 0) throw new Error('Invalid order')
  const store = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1)
  if (!store[0]) throw new Error('Store not found')
  await db.insert(orders).values({ id: `ORD-${Date.now().toString(36).toUpperCase()}`, userId: store[0].userId, storeId: store[0].id, customerName: name, customerEmail: email, totalCents, status: 'pending' })
  return { ok: true }
}

export async function getPublicStore(slug: string) {
  const store = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1)
  if (!store[0]) return null
  const catalog = await db.select().from(products).where(and(eq(products.storeId, store[0].id), eq(products.status, 'active'))).orderBy(desc(products.createdAt))
  return { store: store[0], products: catalog }
}

export async function createProduct(input: { name: string; price: number; stock: number }) {
  const userId = await getUserId()
  const store = await getStore(userId)
  const name = input.name.trim().slice(0, 120)
  const price = Number(input.price)
  const stock = Number(input.stock)
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) throw new Error('Invalid product details')
  await db.insert(products).values({ id: crypto.randomUUID(), userId, storeId: store.id, name, slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`, description: '', priceCents: Math.round(price * 100), stock, status: 'active', category: 'General' })
  revalidatePath('/')
  return { ok: true }
}
