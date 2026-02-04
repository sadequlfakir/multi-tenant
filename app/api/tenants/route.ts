import { NextRequest, NextResponse } from 'next/server'
import { createTenant, getAllTenants, getTenantBySubdomain } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { cacheTenant } from '@/lib/tenant-cache'
import { warmupCache } from '@/lib/cache-warmup'

export async function GET(request: NextRequest) {
  await warmupCache()
  
  const searchParams = request.nextUrl.searchParams
  const subdomain = searchParams.get('subdomain')
  const id = searchParams.get('id')

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
  return NextResponse.json(tenants)
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
    const { name, subdomain, template, config } = body

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

    const tenant = await createTenant(name, subdomain, template, config)
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
