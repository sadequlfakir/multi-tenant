import { NextRequest, NextResponse } from 'next/server'
import { createTenant, getAllTenants, getTenantBySubdomain } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { cacheTenant } from '@/lib/tenant-cache'
import { warmupCache } from '@/lib/cache-warmup'

export async function GET(request: NextRequest) {
  try {
    await warmupCache()
  } catch (e) {
    console.error('Tenants API warmup:', e)
  }

  const searchParams = request.nextUrl.searchParams
  const subdomain = searchParams.get('subdomain')
  const id = searchParams.get('id')
  const isTemplateParam = searchParams.get('isTemplate')

  try {
    if (subdomain) {
      const tenant = await getTenantBySubdomain(subdomain)
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }
      return NextResponse.json(tenant)
    }

    if (id) {
      const { getTenantById } = await import('@/lib/tenant-store')
      const tenant = await getTenantById(id)
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }
      return NextResponse.json(tenant)
    }

    const tenants = await getAllTenants()

    if (isTemplateParam !== null) {
      const wantTemplate = isTemplateParam === 'true'
      const filtered = tenants.filter((t) => (t.isTemplate ?? false) === wantTemplate)
      return NextResponse.json(filtered)
    }

    return NextResponse.json(tenants)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load tenants'
    console.error('GET /api/tenants:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await warmupCache()
    
    // Check authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { getAuthenticatedUser } = await import('@/lib/auth')
    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { name, subdomain, template, config, isTemplate } = body

    if (!name || !subdomain || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subdomain, template' },
        { status: 400 }
      )
    }

    const existingTenant = await getTenantBySubdomain(subdomain)
    if (existingTenant) {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 409 }
      )
    }

    const tenant = await createTenant(
      name,
      subdomain,
      template,
      config,
      Boolean(isTemplate)
    )
    // Cache the tenant for middleware
    cacheTenant(subdomain)
    return NextResponse.json(tenant, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
