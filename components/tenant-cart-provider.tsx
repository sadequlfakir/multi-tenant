'use client'

import { CartProvider } from '@/lib/cart-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { Tenant } from '@/lib/types'

interface TenantCartProviderProps {
  children: React.ReactNode
  tenant: Tenant
}

export function TenantCartProvider({ children, tenant }: TenantCartProviderProps) {
  return (
    <CartProvider tenantId={tenant.id}>
      <WishlistProvider tenantId={tenant.id}>
        {children}
      </WishlistProvider>
    </CartProvider>
  )
}
