import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { Banner } from '@/lib/types'

// GET - Tenant from Host or query. Storefront gets only active; dashboard gets all.
export async function GET(request: NextRequest) {
  try {
    const subdomain = getTenantSubdomainFromRequest(request)
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

    let list = tenant.config.banners || []
    if (!isDashboard) {
      list = list.filter((b) => (b.status ?? 'active') === 'active')
    }
    return NextResponse.json(list)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}

// POST - Create a new banner
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
    const { subdomain: bodySubdomain, ...bannerData } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (set via Host or subdomain in body)' },
        { status: 400 }
      )
    }

    if (!bannerData.image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    if (!bannerData.position || !['after-categories', 'after-products'].includes(bannerData.position)) {
      return NextResponse.json(
        { error: 'Valid position is required (after-categories or after-products)' },
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

    const banners = tenant.config.banners || []

    // Create new banner
    const newBanner: Banner = {
      id: `banner-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: bannerData.title || '',
      description: bannerData.description || '',
      image: bannerData.image,
      link: bannerData.link || '',
      buttonText: bannerData.buttonText || 'Learn More',
      position: bannerData.position,
      status: bannerData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    banners.push(newBanner)

    const updatedTenant = await updateTenantConfig(subdomain, {
      banners,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to create banner' },
        { status: 500 }
      )
    }

    return NextResponse.json(newBanner, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}
