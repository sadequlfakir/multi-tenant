'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

interface EcommerceHeaderProps {
  tenant: Tenant
}

export function EcommerceHeader({ tenant }: EcommerceHeaderProps) {
  const { getCartCount } = useCart()
  const cartCount = getCartCount()

  return (
    <header className="border-b border-border bg-background sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={getTenantLink(tenant, '/')} className="flex items-center gap-2">
          {tenant.config.logo ? (
            <img
              src={tenant.config.logo}
              alt={tenant.config.siteName}
              className="h-9 w-auto max-w-[180px] object-contain object-left"
            />
          ) : (
            <h1 className="text-2xl font-bold text-foreground">{tenant.config.siteName}</h1>
          )}
        </Link>
        <nav className="flex items-center gap-6">
          <Link href={getTenantLink(tenant, '/')} className="text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <Link href={getTenantLink(tenant, '/products')} className="text-muted-foreground hover:text-foreground">
            Products
          </Link>
          <Link href={getTenantLink(tenant, '/track-order')} className="text-muted-foreground hover:text-foreground">
            Track Order
          </Link>
          <Link href={getTenantLink(tenant, '/cart')}>
            <Button variant="outline" size="sm" className="relative border-border text-foreground hover:bg-accent hover:text-accent-foreground">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
