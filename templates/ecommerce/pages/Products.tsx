'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tenant, Product, Category } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ShoppingCart, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { EcommerceHeader } from '@/components/ecommerce-header'
import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_PAGE_SIZE = 12
const SKELETON_CARD_COUNT = 6

function ProductsSidebarSkeleton() {
  return (
    <aside className="order-2 lg:order-1" aria-hidden>
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-5 w-24 mb-4" />
        <ul className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i}>
              <Skeleton className="h-9 w-full rounded-md" />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

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
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-8 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PAGE_SIZE_OPTIONS = [12, 24, 48]
const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'name_desc', label: 'Name: Z–A' },
] as const

interface EcommerceProductsProps {
  tenant: Tenant
}

export default function EcommerceProducts({ tenant }: EcommerceProductsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || searchParams.get('search') || '')
  const { addToCart } = useCart()

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || ''
  const q = searchParams.get('q') || searchParams.get('search') || ''

  const buildProductsUrl = useCallback(
    (updates: { q?: string; category?: string; sort?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (updates.q !== undefined) {
        if (updates.q) params.set('q', updates.q)
        else {
          params.delete('q')
          params.delete('search')
        }
      }
      if (updates.category !== undefined) {
        if (updates.category) params.set('category', updates.category)
        else params.delete('category')
      }
      if (updates.sort !== undefined) {
        if (updates.sort) params.set('sort', updates.sort)
        else params.delete('sort')
      }
      if (updates.page !== undefined) {
        if (updates.page <= 1) params.delete('page')
        else params.set('page', String(updates.page))
      }
      if (updates.limit !== undefined) {
        if (updates.limit === DEFAULT_PAGE_SIZE) params.delete('limit')
        else params.set('limit', String(updates.limit))
      }
      const query = params.toString()
      return getTenantLink(tenant, query ? `/products?${query}` : '/products')
    },
    [tenant, searchParams]
  )

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        if (!res.ok || cancelled) return
        setCategories(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setCategories([])
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [tenant.subdomain])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (q) params.set('search', q)
        if (category) params.set('category', category)
        if (sort) params.set('sort', sort)
        params.set('page', String(page))
        params.set('limit', String(limit))
        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load products')
        }
        if (cancelled) return
        if (data && typeof data === 'object' && Array.isArray(data.products)) {
          setProducts(data.products)
          setTotal(data.total ?? data.products.length)
          setTotalPages(data.totalPages ?? 1)
        } else {
          const list = Array.isArray(data) ? data : []
          setProducts(list)
          setTotal(list.length)
          setTotalPages(1)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load products')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [tenant.subdomain, q, category, sort, page, limit])

  // Debounce search input -> URL (client-side navigation)
  useEffect(() => {
    const t = setTimeout(() => {
      const current = searchParams.get('q') || searchParams.get('search') || ''
      if (searchInput.trim() === current) return
      const next = searchInput.trim()
      const url = buildProductsUrl({ q: next || undefined, page: 1 })
      router.push(url)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, buildProductsUrl, router, searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = searchInput.trim()
    router.push(buildProductsUrl({ q: next || undefined, page: 1 }))
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    router.push(buildProductsUrl({ sort: value || undefined, page: 1 }))
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10)
    router.push(buildProductsUrl({ limit: value, page: 1 }))
  }

  const showPagination = totalPages > 1
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      <section className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-foreground">All Products</h1>

        {/* Search + Sort bar (no filters here) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-16"
                aria-label="Search products"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    router.push(buildProductsUrl({ q: '', page: 1 }))
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground border border-input rounded-md px-2 py-1 bg-background"
                >
                  Clear
                </button>
              )}
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Sort</label>
            <select
              value={sort}
              onChange={handleSortChange}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value || 'relevance'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
          {/* Left sidebar – filters or skeleton */}
          {loading ? (
            <ProductsSidebarSkeleton />
          ) : (
            <aside className="order-2 lg:order-1" aria-label="Filters">
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground mb-3">Categories</h2>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={buildProductsUrl({ category: '', page: 1 })}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                        !category
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      All categories
                    </Link>
                  </li>
                  {categories.map((c) => {
                    const slug = c.slug || c.name
                    const isActive = category === slug
                    return (
                      <li key={c.id}>
                        <Link
                          href={buildProductsUrl({ category: slug, page: 1 })}
                          className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {c.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </aside>
          )}

          {/* Main content (order-1 on mobile so products show first; lg:order-2 in second column on desktop) */}
          <div className="order-1 lg:order-2 min-w-0">

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <>
                <Skeleton className="h-4 w-48 mb-4" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-8 rounded-md" />
                    <Skeleton className="h-9 w-8 rounded-md" />
                    <Skeleton className="h-9 w-8 rounded-md" />
                    <Skeleton className="h-9 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {total === 0
                    ? 'No products found.'
                    : `Showing ${from}–${to} of ${total} products`}
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-muted relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                    {product.category && (
                      <span className="text-xs text-muted-foreground mt-2">
                        Category: {product.category}
                      </span>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xl font-bold">${product.price}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            addToCart(product.id, 1)
                            const button = e.currentTarget as HTMLElement
                            const originalText = button.textContent
                            button.textContent = 'Added!'
                            setTimeout(() => {
                              button.textContent = originalText
                            }, 1500)
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add to Cart
                        </Button>
                        <Link href={getTenantLink(tenant, `/products/${product.id}`)}>
                          <Button size="sm">Details</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
                </div>

                {products.length === 0 && !error && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No products match your filters. Try a different search or category.
                    </p>
                  </div>
                )}

                {/* Pagination + Per page at bottom */}
                <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border pt-6">
                  <div className="flex items-center gap-3">
                    {showPagination && (
                      <nav className="flex flex-wrap items-center gap-2" aria-label="Products pagination">
                        <Link
                          href={buildProductsUrl({ page: page - 1 })}
                          className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                          aria-disabled={page <= 1}
                        >
                          <Button variant="outline" size="sm" disabled={page <= 1}>
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                          </Button>
                        </Link>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => {
                              if (totalPages <= 7) return true
                              if (p === 1 || p === totalPages) return true
                              if (Math.abs(p - page) <= 1) return true
                              return false
                            })
                            .map((p, idx, arr) => {
                              const prev = arr[idx - 1]
                              const showEllipsis = prev !== undefined && p - prev > 1
                              return (
                                <span key={p} className="flex items-center gap-1">
                                  {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
                                  <Link href={buildProductsUrl({ page: p })}>
                                    <Button
                                      variant={p === page ? 'default' : 'outline'}
                                      size="sm"
                                      className="min-w-[2.25rem]"
                                    >
                                      {p}
                                    </Button>
                                  </Link>
                                </span>
                              )
                            })}
                        </div>
                        <Link
                          href={buildProductsUrl({ page: page + 1 })}
                          className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                          aria-disabled={page >= totalPages}
                        >
                          <Button variant="outline" size="sm" disabled={page >= totalPages}>
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </nav>
                    )}
                    {showPagination && (
                      <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">Per page</label>
                    <select
                      value={limit}
                      onChange={handlePageSizeChange}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="Items per page"
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
