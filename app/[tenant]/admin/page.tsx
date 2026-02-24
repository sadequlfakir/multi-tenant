'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Tenant, Order } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { getAuthToken } from '@/lib/auth-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { useTenantAdmin } from './use-tenant-admin'

export default function TenantAdminDashboardPage() {
  const { tenant, loading: tenantLoading, adminBase } = useTenantAdmin()
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    const token = getAuthToken()
    if (!token) return

    const load = async () => {
      try {
        const q = `subdomain=${encodeURIComponent(tenant.subdomain)}`
        const [ordersRes, customersRes] = await Promise.all([
          fetch(`/api/orders?${q}`),
          fetch(`/api/customers?${q}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (ordersRes.ok) {
          const orders: Order[] = await ordersRes.json()
          setTotalOrders(orders.length)
          setTotalRevenue(orders.reduce((s, o) => s + o.total, 0))
          setRecentOrders(orders.slice(0, 5))
        }
        if (customersRes.ok) {
          const customers = await customersRes.json()
          setTotalCustomers(customers.length)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenant])

  if (tenantLoading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Site dashboard</h2>
        <p className="text-gray-500 mt-1">
          Overview for {tenant.config.siteName}
        </p>
      </div>

      {tenant.template === 'ecommerce' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <Link href={`${adminBase}/orders`}>
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`${adminBase}/customers`}>
              <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Customers</p>
                      <p className="text-2xl font-bold text-indigo-600">{totalCustomers}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Link href={`${adminBase}/products`}>
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Products</p>
                      <p className="text-2xl font-bold text-green-600">
                        {tenant.config.products?.length ?? 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Categories</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {tenant.config.categories?.length ?? 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Template</p>
                    <p className="text-lg font-bold text-orange-600 capitalize">{tenant.template}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {recentOrders.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    Recent orders
                  </CardTitle>
                  <CardDescription>Latest 5 orders</CardDescription>
                </div>
                <Link href={`${adminBase}/orders`}>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    View all <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 font-medium">Order #</th>
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Total</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50/50">
                          <td className="py-3 font-mono text-gray-900">{order.orderNumber}</td>
                          <td className="py-3">{order.customer.name}</td>
                          <td className="py-3 font-semibold">
                            ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={
                                order.status === 'delivered'
                                  ? 'default'
                                  : order.status === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="capitalize"
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-2xl font-bold text-blue-600">Active</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Template</p>
                  <p className="text-2xl font-bold text-purple-600 capitalize">{tenant.template}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Projects</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tenant.config.projects?.length ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white">{tenant.config.siteName}</CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                {tenant.config.siteDescription || 'Your site'}
              </CardDescription>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Globe className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Subdomain: <code className="bg-gray-100 px-2 py-0.5 rounded">{tenant.subdomain}</code>
          </p>
          <a
            href={
              typeof window !== 'undefined'
                ? `${window.location.protocol}//${tenant.subdomain}.${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`
                : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              <ExternalLink className="w-4 h-4" />
              Visit live site
            </span>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
