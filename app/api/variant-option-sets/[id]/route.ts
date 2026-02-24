import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { VariantOptionSet, VariantOptionSchema } from '@/lib/types'

function ensureVariantOptionSets(tenant: { config: { variantOptionSets?: VariantOptionSet[] } }): VariantOptionSet[] {
  return tenant.config.variantOptionSets ?? []
}

// GET - Single variant option set
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subdomain = getTenantSubdomainFromRequest(request)

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (subdomain in query or Host)' },
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

    const sets = ensureVariantOptionSets(tenant)
    const item = sets.find((s) => s.id === id)
    if (!item) {
      return NextResponse.json({ error: 'Variant option set not found' }, { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch variant option set' },
      { status: 500 }
    )
  }
}

// PUT - Update variant option set
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
    const { subdomain: bodySubdomain, name, schema } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (subdomain in query or body)' },
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
      const u = users.find((x) => x.id === user.id)
      const ownsByLegacy = u?.tenantId === tenant.id
      const ownsByOwner = tenant.ownerUserId === user.id
      if (!ownsByLegacy && !ownsByOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const sets = ensureVariantOptionSets(tenant)
    const idx = sets.findIndex((s) => s.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Variant option set not found' }, { status: 404 })
    }

    const normalizedSchema: VariantOptionSchema[] = Array.isArray(schema)
      ? schema
          .filter((s: unknown) => s && typeof s === 'object' && 'name' in s && 'values' in s)
          .map((s: { name: string; values: string[] }) => ({
            name: String(s.name).trim(),
            values: Array.isArray(s.values) ? s.values.map((v) => String(v).trim()).filter(Boolean) : [],
          }))
          .filter((s) => s.name && s.values.length > 0)
      : sets[idx].schema

    const updatedSet: VariantOptionSet = {
      ...sets[idx],
      name: typeof name === 'string' && name.trim() ? name.trim() : sets[idx].name,
      schema: normalizedSchema,
      updatedAt: new Date().toISOString(),
    }
    sets[idx] = updatedSet

    const updated = await updateTenantConfig(subdomain, { variantOptionSets: sets })
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update variant option set' }, { status: 500 })
    }
    return NextResponse.json(updatedSet)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update variant option set' },
      { status: 500 }
    )
  }
}

// DELETE - Delete variant option set
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
        { error: 'Tenant is required (subdomain in query or Host)' },
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
      const u = users.find((x) => x.id === user.id)
      const ownsByLegacy = u?.tenantId === tenant.id
      const ownsByOwner = tenant.ownerUserId === user.id
      if (!ownsByLegacy && !ownsByOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const sets = ensureVariantOptionSets(tenant).filter((s) => s.id !== id)
    if (sets.length === tenant.config.variantOptionSets?.length ?? 0) {
      return NextResponse.json({ error: 'Variant option set not found' }, { status: 404 })
    }

    const updated = await updateTenantConfig(subdomain, { variantOptionSets: sets })
    if (!updated) {
      return NextResponse.json({ error: 'Failed to delete variant option set' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete variant option set' },
      { status: 500 }
    )
  }
}
