import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { Product } from '@/lib/types'
import { getSupabase } from '@/lib/supabase'
import { mapProductRow, mapVariantRow } from '@/lib/product-api-mapper'

// GET - List products. Storefront (no auth) gets ONLY active. Dashboard (auth) gets all.
// Query: featured, search (q), category (name or slug), min_price, max_price, sort (price_asc|...), page, limit.
// When page/limit provided, returns { products, total, page, limit, totalPages }. Otherwise returns array (backward compat).
export async function GET(request: NextRequest) {
  try {
    const subdomain = getTenantSubdomainFromRequest(request)
    const searchParams = request.nextUrl.searchParams
    const featured = searchParams.get('featured')
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase()
    const category = (searchParams.get('category') || '').trim()
    const minPriceParam = searchParams.get('min_price')
    const maxPriceParam = searchParams.get('max_price')
    const minPrice = minPriceParam != null && minPriceParam !== '' ? parseFloat(minPriceParam) : null
    const maxPrice = maxPriceParam != null && maxPriceParam !== '' ? parseFloat(maxPriceParam) : null
    const sort = searchParams.get('sort') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12))
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const isDashboard = Boolean(token && (await getAuthenticatedUser(token)))

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (request from tenant host or subdomain in query)' },
        { status: 400 }
      )
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant || tenant.template !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Tenant not found or not an e-commerce site' },
        { status: 404 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error('GET /api/products: Supabase is not configured')
      return NextResponse.json(
        { error: 'Supabase is not configured on the server' },
        { status: 500 }
      )
    }

    const usePagination = searchParams.has('page') || searchParams.has('limit')

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id)

    if (!isDashboard) {
      query = query.eq('status', 'active')
    }
    if (featured === 'true') {
      query = query.eq('featured', true)
    }
    if (search) {
      // Search in name, description, and sku (case-insensitive)
      query = query.or(
        [
          `name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
          `sku.ilike.%${search}%`,
        ].join(',')
      )
    }
    if (category) {
      // Resolve category param (slug or name from URL) to canonical name; products are stored with category name.
      const categories = tenant.config.categories || []
      const categoryLower = category.toLowerCase().trim()
      const resolved = categories.find(
        (c) =>
          (c.slug || '').toLowerCase().trim() === categoryLower ||
          (c.name || '').toLowerCase().trim() === categoryLower
      )
      const filterValue = resolved ? resolved.name : category
      query = query.ilike('category', filterValue)
    }
    if (minPrice != null && !Number.isNaN(minPrice) && minPrice >= 0) {
      query = query.gte('price', minPrice)
    }
    if (maxPrice != null && !Number.isNaN(maxPrice) && maxPrice >= 0) {
      query = query.lte('price', maxPrice)
    }

    const sortKey = sort.toLowerCase()
    if (sortKey === 'price_asc') query = query.order('price', { ascending: true })
    else if (sortKey === 'price_desc') query = query.order('price', { ascending: false })
    else if (sortKey === 'name_asc') query = query.order('name', { ascending: true })
    else if (sortKey === 'name_desc') query = query.order('name', { ascending: false })
    else if (sortKey === 'newest') {
      query = query
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false })
    } else {
      // Default: newest first
      query = query
        .order('created_at', { ascending: false, nullsFirst: false })
    }

    if (usePagination) {
      const fromIndex = (page - 1) * limit
      const toIndex = fromIndex + limit - 1
      const { data, error, count } = await query.range(fromIndex, toIndex)
      if (error) {
        console.error('GET /api/products (supabase):', error)
        return NextResponse.json(
          { error: 'Failed to fetch products' },
          { status: 500 }
        )
      }
      const total = count ?? data?.length ?? 0
      const totalPages = Math.max(1, Math.ceil(total / limit))
      return NextResponse.json({
        products: (data || []) as Product[],
        total,
        page,
        limit,
        totalPages,
      })
    }

    const { data, error } = await query
    if (error) {
      console.error('GET /api/products (supabase, no pagination):', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }
    return NextResponse.json((data || []) as Product[])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subdomain: bodySubdomain, ...productData } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (set via Host or subdomain in body/query)' },
        { status: 400 }
      )
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant || tenant.template !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Tenant not found or not an e-commerce site' },
        { status: 404 }
      )
    }

    // Check if user owns this tenant
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error('POST /api/products: Supabase is not configured')
      return NextResponse.json(
        { error: 'Supabase is not configured on the server' },
        { status: 500 }
      )
    }

    const insertPayload: Record<string, unknown> = {
      tenant_id: tenant.id,
      name: productData.name || '',
      description: productData.description || '',
      price: productData.price || 0,
      image: productData.image || '',
      category: productData.category || '',
      stock: productData.stock ?? null,
      sku: productData.sku || null,
      featured: productData.featured ?? false,
      status: productData.status || 'active',
      seo_title: productData.seoTitle || null,
      seo_description: productData.seoDescription || null,
      seo_keywords: productData.seoKeywords ?? null,
      variant_schema: productData.variantSchema ?? null,
    }

    const { data, error } = await supabase
      .from('products')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      console.error('POST /api/products (supabase):', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    const productId = (data as { id: string }).id
    const variantsPayload = productData.variants as Array<{ options: Record<string, string>; sku?: string; priceAdjustment?: number; stock?: number }> | undefined
    if (Array.isArray(variantsPayload) && variantsPayload.length > 0) {
      for (const v of variantsPayload) {
        await supabase.from('product_variants').insert({
          product_id: productId,
          options: v.options ?? {},
          sku: v.sku ?? null,
          price_adjustment: v.priceAdjustment ?? 0,
          stock: v.stock ?? null,
        })
      }
    }

    const productMapped = mapProductRow(data as Record<string, unknown>)
    const { data: variantsData } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })
    const variants = (variantsData ?? []).map((v) => mapVariantRow(v as Record<string, unknown>))
    return NextResponse.json({ ...productMapped, variants } as Product, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product'
    console.error('POST /api/products:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
