'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAuthToken } from '@/lib/auth-client'
import { getTenantLink } from '@/lib/link-utils'
import type { Tenant } from '@/lib/types'

/**
 * Use in [tenant]/admin/* pages. Returns tenant from subdomain and ensures auth.
 * Redirects to tenant admin login if no token or wrong tenant.
 */
export function useTenantAdmin(): { tenant: Tenant | null; loading: boolean; adminBase: string } {
  const params = useParams()
  const subdomain = params?.tenant as string
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!subdomain) {
      setLoading(false)
      return
    }
    const token = getAuthToken()
    if (!token) {
      window.location.href = getTenantLink({ subdomain } as Tenant, '/admin/login')
      return
    }

    const load = async () => {
      try {
        const [meRes, tenantRes] = await Promise.all([
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/tenants?subdomain=${encodeURIComponent(subdomain)}`),
        ])
        if (!meRes.ok) {
          window.location.href = getTenantLink({ subdomain } as Tenant, '/admin/login')
          return
        }
        const user = await meRes.json()
        if (!tenantRes.ok) {
          setLoading(false)
          return
        }
        const t = await tenantRes.json()
        const isOwnerByLegacyTenantId = user.tenantId === t.id
        const isOwnerByOwnerField = t.ownerUserId === user.id
        if (!isOwnerByLegacyTenantId && !isOwnerByOwnerField) {
          window.location.href = getTenantLink(t, '/admin/login')
          return
        }
        setTenant(t)
      } catch {
        window.location.href = getTenantLink({ subdomain } as Tenant, '/admin/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [subdomain])

  const adminBase = tenant ? getTenantLink(tenant, '/admin') : ''
  return { tenant, loading, adminBase }
}
