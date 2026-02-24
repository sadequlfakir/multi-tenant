import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import type { Collection } from '@/lib/types'

/**
 * GET /api/collections/[id] - Tenant from Host or query.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subdomain = getTenantSubdomainFromRequest(request)
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

    const collections = tenant.config.collections || []
    const collection = collections.find((c) => c.id === id)
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    return NextResponse.json(collection)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch collection'
    console.error('GET /api/collections/[id]:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/collections/[id]
 * Update a collection. Body: { subdomain, title?, description?, productIds?, order? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subdomain: bodySubdomain, title, description, productIds, order } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (Host or subdomain in body)' },
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
      const ownsByLegacy = userData?.tenantId === tenant.id
      const ownsByOwner = (tenant as { ownerUserId?: string }).ownerUserId === user.id
      if (!ownsByLegacy && !ownsByOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const collections = (tenant.config.collections || []).slice()
    const index = collections.findIndex((c) => c.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const updated: Collection = {
      ...collections[index],
      ...(typeof title === 'string' && { title: title.trim() }),
      ...(description !== undefined && {
        description: typeof description === 'string' ? description.trim() || undefined : undefined,
      }),
      ...(Array.isArray(productIds) && {
        productIds: productIds.filter((id: unknown) => typeof id === 'string'),
      }),
      ...(typeof order === 'number' && { order }),
      updatedAt: new Date().toISOString(),
    }
    collections[index] = updated

    const updatedTenant = await updateTenantConfig(subdomain, { collections })
    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to update collection' },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update collection'
    console.error('PUT /api/collections/[id]:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/collections/[id]?subdomain=shop
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subdomain = getTenantSubdomainFromRequest(request)
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (Host or subdomain in query)' },
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
      const ownsByLegacy = userData?.tenantId === tenant.id
      const ownsByOwner = (tenant as { ownerUserId?: string }).ownerUserId === user.id
      if (!ownsByLegacy && !ownsByOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const collections = (tenant.config.collections || []).filter((c) => c.id !== id)
    if (collections.length === tenant.config.collections?.length) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const updatedTenant = await updateTenantConfig(subdomain, { collections })
    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to delete collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete collection'
    console.error('DELETE /api/collections/[id]:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
