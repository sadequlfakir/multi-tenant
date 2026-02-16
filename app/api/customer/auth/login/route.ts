import { NextRequest, NextResponse } from 'next/server'
import { authenticateCustomer } from '@/lib/auth'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, subdomain: bodySubdomain } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant subdomain is required' },
        { status: 400 }
      )
    }

    // Get tenant ID from subdomain
    const { getTenantBySubdomain } = await import('@/lib/tenant-store')
    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant || tenant.template !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Tenant not found or not an e-commerce site' },
        { status: 404 }
      )
    }

    const result = await authenticateCustomer(email, password, tenant.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      token: result.token,
      customer: {
        id: result.customer?.id,
        name: result.customer?.name,
        email: result.customer?.email,
        tenantId: tenant.id,
      },
    })
  } catch (error) {
    console.error('Failed to authenticate customer:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    )
  }
}
