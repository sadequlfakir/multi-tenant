'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tenant } from '@/lib/types'
import type { Category } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'

interface FeaturedCategoriesSectionProps {
  tenant: Tenant
}

function CategoryCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardHeader>
    </Card>
  )
}

export function FeaturedCategoriesSection({ tenant }: FeaturedCategoriesSectionProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/categories?featured=true')
        if (!cancelled && res.ok) {
          const data = await res.json()
          setCategories(Array.isArray(data) ? data : [])
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
      <section className="container mx-auto px-4 py-16 bg-muted">
        <Skeleton className="h-9 w-64 mx-auto mb-12 rounded" />
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (categories.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-16 bg-muted">
      <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Categories</h2>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link key={category.id} href={getTenantLink(tenant, `/products?category=${category.slug}`)}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="aspect-square bg-muted relative">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-4xl font-bold text-primary">{category.name.charAt(0)}</span>
                  </div>
                )}
                <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                  Featured
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
                {category.description && (
                  <CardDescription className="line-clamp-2">{category.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
