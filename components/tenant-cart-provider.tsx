'use client'

import { CartProvider } from '@/lib/cart-context'
import { Tenant } from '@/lib/types'

interface TenantCartProviderProps {
  children: React.ReactNode
  tenant: Tenant
}

export function TenantCartProvider({ children, tenant }: TenantCartProviderProps) {
  return (
    <CartProvider tenantId={tenant.id}>
      {children}
    </CartProvider>
  )
}
