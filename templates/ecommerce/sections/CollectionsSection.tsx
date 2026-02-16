'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tenant } from '@/lib/types'
import type { Collection, Product } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { getProductLink } from '@/lib/product-link-utils'

interface CollectionsSectionProps {
  tenant: Tenant
}

function CollectionBlockSkeleton() {
  return (
    <section className="container mx-auto px-4 py-16">
      <Skeleton className="h-9 w-48 mx-auto mb-4 rounded" />
      <Skeleton className="h-4 w-96 mx-auto mb-12 rounded" />
      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square w-full rounded-none" />
            <CardHeader>
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-10 w-28 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center mt-8">
        <Skeleton className="h-12 w-44 mx-auto rounded-md" />
      </div>
    </section>
  )
}

function getProductsForCollection(productIds: string[], products: Product[]): Product[] {
  if (!productIds?.length) return []
  return productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
}

export function CollectionsSection({ tenant }: CollectionsSectionProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [colRes, prodRes] = await Promise.all([
          fetch('/api/collections'),
          fetch('/api/products'),
        ])
        if (!cancelled && colRes.ok) {
          const data = await colRes.json()
          setCollections(Array.isArray(data) ? data : [])
        }
        if (!cancelled && prodRes.ok) {
          const data = await prodRes.json()
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
      <>
        <CollectionBlockSkeleton />
        <CollectionBlockSkeleton />
      </>
    )
  }

  const sectionsWithProducts = collections
    .map((collection) => ({
      collection,
      products: getProductsForCollection(collection.productIds || [], products),
    }))
    .filter(({ products: p }) => p.length > 0)

  if (sectionsWithProducts.length === 0) return null

  return (
    <>
      {sectionsWithProducts.map(({ collection, products: collectionProducts }) => (
        <section key={collection.id} className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">{collection.title}</h2>
          {collection.description && (
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {collection.description}
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-8">
            {collectionProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
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
      ))}
    </>
  )
}
