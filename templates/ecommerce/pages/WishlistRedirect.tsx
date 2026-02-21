'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { EcommerceHeader } from '@/components/ecommerce-header'

interface WishlistRedirectProps {
  tenant: Tenant
}

export default function WishlistRedirect({ tenant }: WishlistRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('customerTenantId') : null
    const isLoggedIn = !!token && tenantId === tenant.id

    if (isLoggedIn) {
      router.replace(getTenantLink(tenant, '/customer/dashboard?section=wishlist'))
    } else {
      const dashboardWishlist = getTenantLink(tenant, '/customer/dashboard?section=wishlist')
      router.replace(getTenantLink(tenant, `/customer/login?returnUrl=${encodeURIComponent(dashboardWishlist)}`))
    }
  }, [router, tenant])

  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />
      <div className="container mx-auto px-4 py-12 flex items-center justify-center text-muted-foreground">
        Redirecting to wishlist...
      </div>
    </div>
  )
}
