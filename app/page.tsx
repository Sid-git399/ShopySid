import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ShopyDashboard } from '@/components/shopy-dashboard'
import { auth } from '@/lib/auth'
import { getDashboardData } from '@/app/actions/commerce'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const data = await getDashboardData()
  const totalSalesCents = data.orders.reduce((sum, order) => sum + order.totalCents, 0)
  const salesByDay = Array.from({ length: 30 }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (29 - index))
    return data.orders.filter((order) => { const created = new Date(order.createdAt); return created.getFullYear() === day.getFullYear() && created.getMonth() === day.getMonth() && created.getDate() === day.getDate() }).reduce((sum, order) => sum + order.totalCents, 0)
  })
  return <ShopyDashboard totalSalesCents={totalSalesCents} salesByDay={salesByDay} userName={session.user.name} storeSlug={data.store.slug} initialProducts={data.products.map((product) => ({ name: product.name, category: product.category, price: `$${(product.priceCents / 100).toFixed(2)}`, stock: product.stock, status: product.status === 'active' ? 'Active' : 'Draft', tone: 'blue' }))} initialCustomers={data.customers.map((customer) => ({ name: customer.name, email: customer.email, orders: customer.ordersCount, spent: `$${(customer.totalSpentCents / 100).toFixed(2)}` }))} initialOrders={data.orders.map((order) => ({ id: order.id, customer: order.customerName, item: 'Store order', amount: `$${(order.totalCents / 100).toFixed(2)}`, status: order.status[0].toUpperCase() + order.status.slice(1), time: order.createdAt.toLocaleDateString() }))} />
}
