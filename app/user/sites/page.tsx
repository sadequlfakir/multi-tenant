'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import { getTenantSiteUrl } from '@/lib/link-utils'
import {
  Globe,
  Settings,
  ExternalLink,
  Plus,
  LayoutGrid,
  Store,
} from 'lucide-react'

export default function MySitesPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }
    loadSites(token)
  }, [router])

  const loadSites = async (token: string) => {
    try {
      const [meRes, sitesRes] = await Promise.all([
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/my-tenants', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!meRes.ok) {
        router.push('/user/login')
        return
      }
      if (sitesRes.ok) {
        const sites: Tenant[] = await sitesRes.json()
        setTenants(sites)
      } else {
        const user = await meRes.json()
        if (user.tenantId) {
          const tenantRes = await fetch(`/api/tenants?id=${user.tenantId}`)
          if (tenantRes.ok) {
            const t = await tenantRes.json()
            setTenants([t])
          }
        }
      }
    } catch (error) {
      console.error('Failed to load sites', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your sites...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My sites</h1>
              <p className="text-sm text-gray-500 mt-1">
                {tenants.length === 0
                  ? 'Create and manage your websites'
                  : `${tenants.length} site${tenants.length === 1 ? '' : 's'}`
              }
              </p>
            </div>
            <Link href="/user/create-site">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add site
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {tenants.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {tenants.map((tenant) => (
              <Card
                key={tenant.id}
                className="border-2 overflow-hidden hover:border-blue-200 transition-colors"
              >
                <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-slate-100/80 border-b">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border shadow-sm flex items-center justify-center shrink-0">
                        {tenant.template === 'ecommerce' ? (
                          <Store className="w-6 h-6 text-indigo-600" />
                        ) : (
                          <LayoutGrid className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">
                          {tenant.config.siteName || tenant.name}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono mt-0.5">
                          {tenant.subdomain}
                        </CardDescription>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-200 text-gray-800 capitalize">
                      {tenant.template}
                    </span>
                  </div>
                  {tenant.config.siteDescription && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {tenant.config.siteDescription}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={getTenantSiteUrl(tenant, '/admin')}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="default" size="sm" className="w-full sm:w-auto">
                        <Settings className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </a>
                    <a
                      href={getTenantSiteUrl(tenant)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit site
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed max-w-xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
                <Globe className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No sites yet</h2>
              <p className="text-gray-600 mb-6">
                Create your first website with an e‑commerce or portfolio template. You can add more
                sites anytime.
              </p>
              <Link href="/user/create-site">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
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
