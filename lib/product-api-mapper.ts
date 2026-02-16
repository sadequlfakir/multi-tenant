import type { Product, ProductVariant } from '@/lib/types'

type DbProduct = Record<string, unknown>
type DbVariant = Record<string, unknown>

export function mapProductRow(row: DbProduct): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    price: Number(row.price ?? 0),
    image: (row.image as string) ?? '',
    category: (row.category as string) ?? undefined,
    stock: row.stock != null ? Number(row.stock) : undefined,
    sku: (row.sku as string) ?? undefined,
    slug: (row.slug as string) ?? undefined,
    featured: Boolean(row.featured),
    status: (row.status as Product['status']) ?? 'active',
    variantSchema: (row.variant_schema as Product['variantSchema']) ?? undefined,
    seoTitle: (row.seo_title as string) ?? undefined,
    seoDescription: (row.seo_description as string) ?? undefined,
    seoKeywords: Array.isArray(row.seo_keywords) ? row.seo_keywords as string[] : undefined,
    createdAt: (row.created_at as string) ?? undefined,
    updatedAt: (row.updated_at as string) ?? undefined,
  }
}

export function mapVariantRow(row: DbVariant): ProductVariant {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    options: (row.options as Record<string, string>) ?? {},
    sku: (row.sku as string) ?? undefined,
    priceAdjustment: Number(row.price_adjustment ?? 0),
    stock: row.stock != null ? Number(row.stock) : undefined,
    createdAt: (row.created_at as string) ?? undefined,
    updatedAt: (row.updated_at as string) ?? undefined,
  }
}
