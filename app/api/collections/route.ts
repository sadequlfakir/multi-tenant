import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import type { Collection } from '@/lib/types'

/**
 * GET /api/collections - Tenant from Host or query. Returns all collections for the tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const subdomain = getTenantSubdomainFromRequest(request)
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (request must be from tenant host or include subdomain)' },
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

    const collections = (tenant.config.collections || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return NextResponse.json(collections)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch collections'
    console.error('GET /api/collections:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/collections
 * Create a new collection. Body: { subdomain, title, description?, productIds? }
 * Requires auth and tenant ownership.
 */
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
    const { subdomain: bodySubdomain, title, description, productIds } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain || !title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Tenant and title are required (tenant via Host or subdomain in body)' },
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

    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find((u) => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const collections = tenant.config.collections || []
    const ids = Array.isArray(productIds) ? productIds : []
    const newCollection: Collection = {
      id: `collection-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() || undefined : undefined,
      productIds: ids.filter((id: unknown) => typeof id === 'string'),
      order: collections.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    collections.push(newCollection)

    const updated = await updateTenantConfig(subdomain, { collections })
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to save collection' },
        { status: 500 }
      )
    }

    return NextResponse.json(newCollection, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create collection'
    console.error('POST /api/collections:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
