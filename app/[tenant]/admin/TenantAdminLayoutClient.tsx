'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Tenant } from '@/lib/types'
import { getAuthToken, clearAuthToken } from '@/lib/auth-client'
import { getMainAppUrl, getTenantLink } from '@/lib/link-utils'
import {
  LayoutDashboard,
  Package,
  FolderKanban,
  LayoutGrid,
  Image,
  ShoppingBag,
  Users,
  Layers,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/ui/sidebar'

interface TenantAdminLayoutClientProps {
  tenant: Tenant
  children: React.ReactNode
}

export function TenantAdminLayoutClient({ tenant, children }: TenantAdminLayoutClientProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<{ id: string; tenantId: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const sidebarTenant = useMemo(
    () => ({
      subdomain: tenant.subdomain,
      template: tenant.template,
    }),
    [tenant.subdomain, tenant.template]
  )

  const isLoginPage = pathname?.endsWith('/admin/login') ?? pathname?.includes('/admin/login')

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    const token = getAuthToken()
    if (!token) {
      window.location.href = getTenantLink(tenant, '/admin/login')
      return
    }

    const check = async () => {
      try {
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!meRes.ok) {
          clearAuthToken()
          window.location.href = getTenantLink(tenant, '/admin/login')
          return
        }
        const userData = await meRes.json()
        if (userData.tenantId !== tenant.id) {
          clearAuthToken()
          window.location.href = getTenantLink(tenant, '/admin/login')
          return
        }
        setUser(userData)
      } catch {
        clearAuthToken()
        window.location.href = getTenantLink(tenant, '/admin/login')
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [tenant.id, tenant, isLoginPage])

  const handleLogout = () => {
    clearAuthToken()
    localStorage.removeItem('userType')
    window.location.href = getTenantLink(tenant, '/admin/login')
  }

  const adminBase = getTenantLink(tenant, '/admin')

  const nav = [
    { name: 'Dashboard', href: adminBase, icon: LayoutDashboard },
    ...(tenant.template === 'ecommerce'
      ? [
          { name: 'Products', href: `${adminBase}/products`, icon: Package },
          { name: 'Categories', href: `${adminBase}/categories`, icon: FolderKanban },
          { name: 'Collections', href: `${adminBase}/collections`, icon: LayoutGrid },
          { name: 'Variants', href: `${adminBase}/variants`, icon: Layers },
          { name: 'Banners', href: `${adminBase}/banners`, icon: Image },
          { name: 'Orders', href: `${adminBase}/orders`, icon: ShoppingBag },
          { name: 'Customers', href: `${adminBase}/customers`, icon: Users },
        ]
      : tenant.template === 'portfolio'
        ? [{ name: 'Projects', href: `${adminBase}/projects`, icon: FolderKanban }]
        : []),
    { name: 'Settings', href: `${adminBase}/settings`, icon: Settings },
  ]

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar tenant={sidebarTenant} onLogout={handleLogout} navigation={nav} />
      <div className="lg:pl-64">
        <header className="h-14 shrink-0 bg-white border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {tenant.config.siteName}
            </h1>
            <span className="hidden sm:inline text-sm text-gray-500">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={getMainAppUrl('/user/dashboard')} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                My sites
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
