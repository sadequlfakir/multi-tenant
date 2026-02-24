'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import {
  Globe,
  Settings,
  Plus,
  User,
  ArrowRight,
  LayoutDashboard,
  Store,
  LayoutGrid,
} from 'lucide-react'

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

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

      const sitesRes = await fetch('/api/my-tenants', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (sitesRes.ok) {
        const sites: Tenant[] = await sitesRes.json()
        if (sites.length > 0) {
          setTenants(sites)
          return
        }
      }
      if (userData.tenantId) {
        const tenantRes = await fetch(`/api/tenants?id=${userData.tenantId}`)
        if (tenantRes.ok) {
          const t = await tenantRes.json()
          setTenants([t])
        }
      }
    } catch (error) {
      console.error('Failed to load user data', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const siteCount = tenants.length

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl">
        {/* Overview stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border-2">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{siteCount}</p>
                <p className="text-sm text-gray-500">Sites</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.filter((t) => t.template === 'ecommerce').length}
                </p>
                <p className="text-sm text-gray-500">Stores</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.filter((t) => t.template === 'portfolio').length}
                </p>
                <p className="text-sm text-gray-500">Portfolios</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Primary actions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/user/sites">
              <Card className="border-2 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      My sites
                    </CardTitle>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <CardDescription>
                    {siteCount === 0
                      ? 'Create and manage your websites'
                      : `View and manage your ${siteCount} site${siteCount === 1 ? '' : 's'}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/user/create-site">
              <Card className="border-2 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer h-full border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Plus className="w-5 h-5 text-indigo-600" />
                      Add new site
                    </CardTitle>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <CardDescription>
                    Launch a new store or portfolio from a template
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>

        {/* Account & settings */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Account settings
                </CardTitle>
                <CardDescription>Password, security, and delete account</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/user/settings">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Open settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-2 bg-gray-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-gray-600" />
                  Dashboard
                </CardTitle>
                <CardDescription>Overview of your sites and quick actions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">You’re here. Use the sidebar to open My sites or Settings.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Empty state hint when no sites */}
        {siteCount === 0 && (
          <Card className="mt-8 border-2 border-blue-100 bg-blue-50/30">
            <CardContent className="p-6">
              <p className="font-medium text-gray-900 mb-1">Get started</p>
              <p className="text-sm text-gray-600 mb-4">
                Create your first site to get a live store or portfolio. You can add more sites anytime from My sites.
              </p>
              <Link href="/user/create-site">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first site
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
