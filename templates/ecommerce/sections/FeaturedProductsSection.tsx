'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tenant } from '@/lib/types'
import type { Product } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { getProductLink } from '@/lib/product-link-utils'

interface FeaturedProductsSectionProps {
  tenant: Tenant
}

const FEATURED_LIMIT = 6

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardHeader>
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

export function FeaturedProductsSection({ tenant }: FeaturedProductsSectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/products?featured=true')
        if (!cancelled && res.ok) {
          const data = await res.json()
          setProducts(Array.isArray(data) ? data : [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [tenant.subdomain])

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <Skeleton className="h-9 w-56 mx-auto mb-12 rounded" />
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Skeleton className="h-12 w-44 mx-auto rounded-md" />
        </div>
      </section>
    )
  }

  const displayProducts = products.slice(0, FEATURED_LIMIT)
  if (displayProducts.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Products</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {displayProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-muted relative">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
              <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                Featured
              </span>
            </div>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription className="line-clamp-2">{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${product.price}</span>
                <Link href={getProductLink(tenant, product)}>
                  <Button>View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link href={getTenantLink(tenant, '/products')}>
          <Button variant="outline" size="lg" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
            View All Products
          </Button>
        </Link>
      </div>
    </section>
  )
}
