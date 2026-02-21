'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tenant, Product } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { getProductLink } from '@/lib/product-link-utils'
import { Heart, ShoppingCart, ArrowLeft, AlertCircle } from 'lucide-react'
import { useWishlist } from '@/lib/wishlist-context'
import { useCart } from '@/lib/cart-context'
import { EcommerceHeader } from '@/components/ecommerce-header'
import { Skeleton } from '@/components/ui/skeleton'

interface WishlistPageProps {
  tenant: Tenant
}

interface WishlistItemWithProduct {
  id: string
  productId: string
  product?: {
    id: string
    name: string
    description: string
    price: number
    image: string
    stock?: number
    status?: string
    slug?: string
    isAvailable: boolean
  }
}

export default function WishlistPage({ tenant }: WishlistPageProps) {
  const { wishlistIds, removeFromWishlist, isLoading: wishlistLoading } = useWishlist()
  const { addToCart } = useCart()
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('customerTenantId') : null
    setIsLoggedIn(!!token && tenantId === tenant.id)
  }, [tenant.id])

  useEffect(() => {
    if (wishlistLoading) return

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const token = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null
        const tenantId = typeof window !== 'undefined' ? localStorage.getItem('customerTenantId') : null
        const loggedIn = !!token && tenantId === tenant.id

        if (loggedIn && token && wishlistIds.length > 0) {
          // Load from API (includes product details with availability)
          const res = await fetch('/api/customer/wishlist', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) setWishlistItems(Array.isArray(data) ? data : [])
          } else {
            throw new Error('Failed to load wishlist')
          }
        } else if (wishlistIds.length > 0) {
          // Load products for guest wishlist
          const params = new URLSearchParams()
          params.set('ids', wishlistIds.join(','))
          params.set('subdomain', tenant.subdomain)
          const res = await fetch(`/api/products?${params.toString()}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'Failed to load wishlist')
          const list = Array.isArray(data) ? data : (data?.products ?? [])
          const byId = new Map(list.map((p: Product) => [p.id, p]))
          const ordered = wishlistIds
            .map((id) => {
              const product = byId.get(id)
              if (!product) return null
              return {
                id: `guest-${id}`,
                productId: id,
                product: {
                  id: product.id,
                  name: product.name,
                  description: product.description || '',
                  price: product.price,
                  image: product.image,
                  stock: product.stock,
                  status: product.status,
                  slug: product.slug,
                  isAvailable: product.status === 'active' && (product.stock == null || product.stock > 0),
                },
              }
            })
            .filter(Boolean) as WishlistItemWithProduct[]
          if (!cancelled) setWishlistItems(ordered)
        } else {
          if (!cancelled) setWishlistItems([])
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load wishlist')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [wishlistIds.join(','), tenant.subdomain, tenant.id, wishlistLoading])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EcommerceHeader tenant={tenant} />

      <section className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href={getTenantLink(tenant, '/products')}>
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground">Wishlist</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        {loading || wishlistLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full rounded-none" />
                <CardHeader>
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-20 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">Save items you like by clicking the heart on product pages.</p>
              <Link href={getTenantLink(tenant, '/products')}>
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => {
              const product = item.product
              if (!product) return null

              const isAvailable = product.isAvailable
              const stockStatus =
                product.stock != null
                  ? product.stock === 0
                    ? 'Out of Stock'
                    : product.stock < 5
                      ? `Only ${product.stock} left`
                      : 'In Stock'
                  : 'In Stock'

              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-sm">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Unavailable
                        </Badge>
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full bg-background/90 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeFromWishlist(product.id)}
                      aria-label="Remove from wishlist"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                  <CardHeader>
                    <CardTitle>
                      <Link href={getProductLink(tenant, product as Product)} className="hover:underline">
                        {product.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      {isAvailable ? (
                        <Badge variant="outline" className="text-xs">
                          {stockStatus}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          {product.status === 'draft' ? 'Draft' : 'Out of Stock'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-2xl font-bold">${product.price}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addToCart(
                            {
                              id: product.id,
                              name: product.name,
                              image: product.image,
                              price: product.price,
                              description: product.description,
                              stock: product.stock,
                            },
                            1
                          )
                        }
                        disabled={!isAvailable}
                        className="flex-1"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {isAvailable ? 'Add to Cart' : 'Unavailable'}
                      </Button>
                      <Link href={getProductLink(tenant, product as Product)}>
                        <Button size="sm">Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <footer className="bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
