import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'

// GET - Tenant from Host or query
export async function GET(request: NextRequest) {
  try {
    const subdomain = getTenantSubdomainFromRequest(request)

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

    return NextResponse.json(tenant.config.sliderConfig || { autoPlay: true, interval: 5000 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch slider config' },
      { status: 500 }
    )
  }
}

// PUT - Update slider config
export async function PUT(request: NextRequest) {
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
    const { subdomain: bodySubdomain, ...configData } = body
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

    // Check if user owns this tenant
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Validate interval if provided
    if (configData.interval !== undefined) {
      const interval = parseInt(configData.interval)
      if (isNaN(interval) || interval < 1000) {
        return NextResponse.json(
          { error: 'Interval must be at least 1000ms (1 second)' },
          { status: 400 }
        )
      }
    }

    const updatedTenant = await updateTenantConfig(subdomain, {
      sliderConfig: {
        autoPlay: configData.autoPlay !== undefined ? configData.autoPlay : true,
        interval: configData.interval !== undefined ? parseInt(configData.interval) : 5000,
      },
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to update slider config' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedTenant.config.sliderConfig)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update slider config' },
      { status: 500 }
    )
  }
}
