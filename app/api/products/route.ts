import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { Product } from '@/lib/types'

// GET - List products. Storefront (no auth) gets ONLY active. Dashboard (auth) gets all.
// Query: featured, search (q), category (name or slug), sort (price_asc|price_desc|name_asc|name_desc|newest), page, limit.
// When page/limit provided, returns { products, total, page, limit, totalPages }. Otherwise returns array (backward compat).
export async function GET(request: NextRequest) {
  try {
    const subdomain = getTenantSubdomainFromRequest(request)
    const searchParams = request.nextUrl.searchParams
    const featured = searchParams.get('featured')
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase()
    const category = (searchParams.get('category') || '').trim()
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

    let list = tenant.config.products || []
    if (!isDashboard) {
      list = list.filter((p) => (p.status ?? 'active') === 'active')
    }
    if (featured === 'true') {
      list = list.filter((p) => Boolean(p.featured))
    }

    if (search) {
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(search) ||
          (p.description || '').toLowerCase().includes(search) ||
          (p.sku || '').toLowerCase().includes(search)
      )
    }

    if (category) {
      const categories = tenant.config.categories || []
      const categoryBySlug = categories.find((c) => (c.slug || '').toLowerCase() === category.toLowerCase())
      const categoryName = categoryBySlug ? categoryBySlug.name : category
      list = list.filter((p) => (p.category || '').toLowerCase() === categoryName.toLowerCase())
    }

    const total = list.length

    const sortKey = sort.toLowerCase()
    if (sortKey === 'price_asc') list = list.slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    else if (sortKey === 'price_desc') list = list.slice().sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    else if (sortKey === 'name_asc') list = list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    else if (sortKey === 'name_desc') list = list.slice().sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    else if (sortKey === 'newest') list = list.slice().sort((a, b) => (new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()))

    const usePagination = searchParams.has('page') || searchParams.has('limit')
    if (usePagination) {
      const totalPages = Math.max(1, Math.ceil(total / limit))
      const pageIndex = Math.min(page, totalPages)
      const start = (pageIndex - 1) * limit
      const products = list.slice(start, start + limit)
      return NextResponse.json({ products, total, page: pageIndex, limit, totalPages })
    }

    return NextResponse.json(list)
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

    // Create new product
    const newProduct: Product = {
      id: `product-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: productData.name || '',
      description: productData.description || '',
      price: productData.price || 0,
      image: productData.image || '',
      category: productData.category || '',
      stock: productData.stock ?? undefined,
      sku: productData.sku || undefined,
      featured: productData.featured || false,
      status: productData.status || 'active',
      seoTitle: productData.seoTitle || undefined,
      seoDescription: productData.seoDescription || undefined,
      seoKeywords: Array.isArray(productData.seoKeywords)
        ? productData.seoKeywords
        : typeof productData.seoKeywords === 'string'
          ? productData.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const products = tenant.config.products || []
    products.push(newProduct)

    const updatedTenant = await updateTenantConfig(subdomain, {
      products,
    })

    if (!updatedTenant) {
      console.error('POST /api/products: updateTenantConfig returned null for subdomain', subdomain)
      return NextResponse.json(
        { error: 'Failed to save tenant config. Tenant may have been deleted.' },
        { status: 500 }
      )
    }

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product'
    console.error('POST /api/products:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
