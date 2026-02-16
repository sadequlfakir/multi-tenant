import { Metadata } from 'next'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { findRouteHandler } from '@/lib/template-registry'
import { cacheTenant, removeTenantFromCache } from '@/lib/tenant-cache'
import { notFound } from 'next/navigation'
import { TenantCartProvider } from '@/components/tenant-cart-provider'
import type { Product } from '@/lib/types'

// Ensure templates are registered
import '@/templates'

// Always resolve tenant from DB so deleted tenants show 404, not cached content
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ tenant: string; slug: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant: tenantSubdomain, slug } = await params
  const tenant = await getTenantBySubdomain(tenantSubdomain)
  if (!tenant) return {}

  const path = '/' + slug.join('/')
  const routeMatch = findRouteHandler(tenant.template, path)
  if (!routeMatch) return {}

  // Product detail: /products/[id] or /products/[slug] -> params.id
  const productId = routeMatch.params?.id
  if (tenant.template === 'ecommerce' && productId && path.startsWith('/products/')) {
    // Fetch product directly from database for SEO metadata
    try {
      const { getSupabase } = await import('@/lib/supabase')
      const { mapProductRow } = await import('@/lib/product-api-mapper')
      const supabase = getSupabase()
      
      if (supabase) {
        // Support both UUID (id) and slug lookups
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
        
        let query = supabase
          .from('products')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('status', 'active')
        
        if (isUUID) {
          query = query.eq('id', productId)
        } else {
          query = query.eq('slug', productId)
        }
        
        const { data, error } = await query.single()
        
        if (!error && data) {
          const product = mapProductRow(data as Record<string, unknown>)
          const title = product.seoTitle || product.name
          const description =
            product.seoDescription ||
            product.description ||
            `${product.name} - ${tenant.config.siteName}`
          const keywords = product.seoKeywords?.length
            ? product.seoKeywords.join(', ')
            : undefined
          return {
            title: `${title} | ${tenant.config.siteName}`,
            description: description.slice(0, 160),
            keywords: keywords,
            openGraph: {
              title: `${title} | ${tenant.config.siteName}`,
              description: description.slice(0, 160),
              images: product.image ? [product.image] : undefined,
            },
            twitter: {
              card: 'summary_large_image',
              title: `${title} | ${tenant.config.siteName}`,
              description: description.slice(0, 160),
              images: product.image ? [product.image] : undefined,
            },
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch product for SEO metadata:', error)
    }
  }

  return {}
}

export default async function TenantDynamicRoute({
  params,
}: {
  params: Promise<{ tenant: string; slug: string[] }>
}) {
  const { tenant: tenantSubdomain, slug } = await params
  const tenant = await getTenantBySubdomain(tenantSubdomain)

  if (!tenant) {
    // Tenant was deleted (e.g. from DB); remove stale entry so middleware stops treating it as valid
    removeTenantFromCache(tenantSubdomain)
    notFound()
  }

  // Cache the tenant for future middleware requests
  cacheTenant(tenantSubdomain)

  // Build path from slug array
  const path = '/' + slug.join('/')

  // Find matching route handler
  const routeMatch = findRouteHandler(tenant.template, path)

  if (!routeMatch) {
    notFound()
  }

  // Render the matched component with CartProvider
  return (
    <TenantCartProvider tenant={tenant}>
      {routeMatch.handler.component(tenant, routeMatch.params)}
    </TenantCartProvider>
  )
}
