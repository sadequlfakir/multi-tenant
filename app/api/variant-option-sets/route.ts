import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { VariantOptionSet, VariantOptionSchema } from '@/lib/types'

function ensureVariantOptionSets(tenant: { config: { variantOptionSets?: VariantOptionSet[] } }): VariantOptionSet[] {
  return tenant.config.variantOptionSets ?? []
}

// GET - List variant option sets for tenant
export async function GET(request: NextRequest) {
  try {
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

    const list = ensureVariantOptionSets(tenant)
    return NextResponse.json(list)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch variant option sets' },
      { status: 500 }
    )
  }
}

// POST - Create variant option set
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
    const { subdomain: bodySubdomain, name, schema } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (subdomain in query or body)' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
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
      if (u?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const normalizedSchema: VariantOptionSchema[] = Array.isArray(schema)
      ? schema
          .filter((s: unknown) => s && typeof s === 'object' && 'name' in s && 'values' in s)
          .map((s: { name: string; values: string[] }) => ({
            name: String(s.name).trim(),
            values: Array.isArray(s.values) ? s.values.map((v) => String(v).trim()).filter(Boolean) : [],
          }))
          .filter((s) => s.name && s.values.length > 0)
      : []

    const sets = ensureVariantOptionSets(tenant)
    const newSet: VariantOptionSet = {
      id: `vos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      schema: normalizedSchema,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    sets.push(newSet)

    const updated = await updateTenantConfig(subdomain, { variantOptionSets: sets })
    if (!updated) {
      return NextResponse.json({ error: 'Failed to create variant option set' }, { status: 500 })
    }
    return NextResponse.json(newSet, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create variant option set' },
      { status: 500 }
    )
  }
}
