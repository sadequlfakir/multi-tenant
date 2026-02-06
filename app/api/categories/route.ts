import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { Category } from '@/lib/types'

// GET - Tenant from Host or query. Query: featured (true = only featured).
export async function GET(request: NextRequest) {
  try {
    const subdomain = getTenantSubdomainFromRequest(request)
    const featured = request.nextUrl.searchParams.get('featured')
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const isDashboard = Boolean(token && (await getAuthenticatedUser(token)))

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (request from tenant host or subdomain)' },
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

    let list = tenant.config.categories || []
    if (!isDashboard) {
      list = list.filter((c) => (c.status ?? 'active') === 'active')
    }
    if (featured === 'true') {
      list = list.filter((c) => Boolean(c.featured))
    }
    list = list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return NextResponse.json(list)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST - Create a new category
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
    const { subdomain: bodySubdomain, ...categoryData } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (set via Host or subdomain in body/query)' },
        { status: 400 }
      )
    }

    if (!categoryData.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
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

    // Generate slug from name
    const slug = categoryData.slug || categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const categories = tenant.config.categories || []
    const existingCategory = categories.find(c => c.slug === slug)
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Create new category
    const newCategory: Category = {
      id: `category-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: categoryData.name,
      slug,
      description: categoryData.description || '',
      image: categoryData.image || '',
      parentId: categoryData.parentId || undefined,
      order: categoryData.order ?? categories.length,
      featured: categoryData.featured || false,
      status: categoryData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    categories.push(newCategory)

    const updatedTenant = await updateTenantConfig(subdomain, {
      categories,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
