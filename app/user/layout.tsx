'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { Tenant } from '@/lib/types'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  // Memoize tenant data for sidebar to prevent re-renders
  const sidebarTenant = useMemo(() => {
    if (!tenant) return null
    return {
      subdomain: tenant.subdomain,
      template: tenant.template,
    }
  }, [tenant?.subdomain, tenant?.template])

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

      // Get user's tenant
      if (userData.tenantId) {
        const tenantRes = await fetch(`/api/tenants?id=${userData.tenantId}`)
        if (tenantRes.ok) {
          const userTenant = await tenantRes.json()
          setTenant(userTenant)
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { clearAuthToken } = await import('@/lib/auth-client')
    clearAuthToken()
    localStorage.removeItem('userType')
    router.push('/')
  }

  // Don't show layout for login/register pages
  if (pathname === '/user/login' || pathname === '/user/register') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar tenant={sidebarTenant} onLogout={handleLogout} />
      <div className="lg:pl-64">
        {children}
      </div>
    </div>
  )
}
