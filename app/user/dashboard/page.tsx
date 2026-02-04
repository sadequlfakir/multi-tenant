'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Tenant, Order } from '@/lib/types'
import {
  Settings,
  ExternalLink,
  Plus,
  Globe,
  Edit,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Package,
  FolderKanban,
  Activity,
  ShoppingBag,
  Users,
  DollarSign,
  ArrowRight,
} from 'lucide-react'
import { getTenantSiteUrl } from '@/lib/link-utils'
import { Badge } from '@/components/ui/badge'

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const [totalCustomers, setTotalCustomers] = useState<number>(0)
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }

    loadUserData(token)
  }, [router])

  const loadUserData = async (token: string) => {
    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!meRes.ok) {
        router.push('/user/login')
        return
      }

      const userData = await meRes.json()
      setUser(userData)

      if (userData.tenantId) {
        const tenantRes = await fetch(`/api/tenants?id=${userData.tenantId}`)
        if (tenantRes.ok) {
          const userTenant = await tenantRes.json()
          setTenant(userTenant)
          if (userTenant.template === 'ecommerce') {
            loadEcommerceStats(userTenant.subdomain, token)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEcommerceStats = async (subdomain: string, token: string) => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        fetch(`/api/orders?subdomain=${subdomain}`),
        fetch(`/api/customers?subdomain=${subdomain}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (ordersRes.ok) {
        const orders: Order[] = await ordersRes.json()
        setTotalOrders(orders.length)
        setTotalRevenue(orders.reduce((sum, o) => sum + o.total, 0))
        setRecentOrders(orders.slice(0, 5))
      }
      if (customersRes.ok) {
        const customers = await customersRes.json()
        setTotalCustomers(customers.length)
      }
    } catch (error) {
      console.error('Failed to load ecommerce stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Top header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {tenant && (
                <a
                  href={getTenantSiteUrl(tenant)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Site
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="p-4 sm:p-6 lg:p-8">
          {tenant ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                {tenant.template === 'ecommerce' ? (
                  <>
                    <Link href="/user/orders">
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
                    <Link href="/user/customers">
                      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Total Customers</p>
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
                            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
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
                    <Link href="/user/products">
                      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Products</p>
                              <p className="text-2xl font-bold text-green-600">
                                {tenant.config.products?.length || 0}
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
                              {tenant.config.categories?.length || 0}
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
                            <p className="text-sm text-gray-600 mb-1">Site</p>
                            <p className="text-lg font-bold text-orange-600 capitalize">{tenant.template}</p>
                          </div>
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Site Status</p>
                            <p className="text-2xl font-bold text-blue-600">Active</p>
                          </div>
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-blue-600" />
                          </div>
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
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Link href="/user/projects">
                      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Projects</p>
                              <p className="text-2xl font-bold text-green-600">
                                {tenant.config.projects?.length || 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <FolderKanban className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Created</p>
                            <p className="text-lg font-bold text-orange-600">
                              {new Date(tenant.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Recent Orders (ecommerce only) */}
              {tenant.template === 'ecommerce' && recentOrders.length > 0 && (
                <Card className="mb-8 border-2 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        Recent Orders
                      </CardTitle>
                      <CardDescription>Latest 5 orders</CardDescription>
                    </div>
                    <Link href="/user/orders">
                      <Button variant="outline" size="sm">
                        View all
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
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

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Website Details Card */}
                <Card className="lg:col-span-2 border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-white">{tenant.config.siteName}</CardTitle>
                        <CardDescription className="text-blue-100 mt-1">
                          {tenant.config.siteDescription || 'Your website is live and ready!'}
                        </CardDescription>
                      </div>
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Globe className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Subdomain</p>
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1.5 bg-gray-100 rounded-md text-sm font-mono text-gray-800">
                            {tenant.subdomain}
                          </code>
                          <span className="text-gray-400">.yourdomain.com</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Template</p>
                        <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-md text-sm font-semibold capitalize">
                          {tenant.template}
                        </span>
                      </div>

                      {tenant.config.customDomain && (
                        <div className="space-y-2 md:col-span-2">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Custom Domain</p>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-lg font-semibold text-gray-900">{tenant.config.customDomain}</span>
                            {tenant.config.customDomainVerified && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {tenant.config.contactEmail && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact Email</p>
                          <p className="text-gray-900">{tenant.config.contactEmail}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t flex gap-4">
                      <a href={getTenantSiteUrl(tenant)} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Live Site
                        </Button>
                      </a>
                      <Link href="/user/settings" className="flex-1">
                        <Button variant="outline" className="w-full border-2">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Settings
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Sidebar */}
                <div className="space-y-6">
                  <Card className="border-2 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href="/user/settings">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <Settings className="w-5 h-5 mr-2" />
                          Website Settings
                        </Button>
                      </Link>
                      {tenant.template === 'ecommerce' && (
                        <>
                          <Link href="/user/products">
                            <Button variant="outline" className="w-full justify-start" size="lg">
                              <Package className="w-5 h-5 mr-2" />
                              Manage Products
                            </Button>
                          </Link>
                          <Link href="/user/categories">
                            <Button variant="outline" className="w-full justify-start" size="lg">
                              <FolderKanban className="w-5 h-5 mr-2" />
                              Categories
                            </Button>
                          </Link>
                          <Link href="/user/banners">
                            <Button variant="outline" className="w-full justify-start" size="lg">
                              <Activity className="w-5 h-5 mr-2" />
                              Banners & Sliders
                            </Button>
                          </Link>
                          <Link href="/user/orders">
                            <Button variant="outline" className="w-full justify-start" size="lg">
                              <ShoppingBag className="w-5 h-5 mr-2" />
                              Orders ({totalOrders})
                            </Button>
                          </Link>
                          <Link href="/user/customers">
                            <Button variant="outline" className="w-full justify-start" size="lg">
                              <Users className="w-5 h-5 mr-2" />
                              Customers ({totalCustomers})
                            </Button>
                          </Link>
                        </>
                      )}
                      {tenant.template === 'portfolio' && (
                        <Link href="/user/projects">
                          <Button variant="outline" className="w-full justify-start" size="lg">
                            <FolderKanban className="w-5 h-5 mr-2" />
                            Manage Projects
                          </Button>
                        </Link>
                      )}
                      <a href={getTenantSiteUrl(tenant)} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <ExternalLink className="w-5 h-5 mr-2" />
                          View Live Site
                        </Button>
                      </a>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader>
                      <CardTitle className="text-lg">Need Help?</CardTitle>
                      <CardDescription>
                        Get support and learn how to customize your website
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" size="sm">
                        Contact Support
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            /* No Tenant State */
            <Card className="max-w-2xl mx-auto border-2 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Create Your First Website</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Get started by creating your website. Choose a template and customize it to your needs.
                </p>
                <Link href="/user/create-site">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg px-8">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Website
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
      </main>
    </>
  )
}
