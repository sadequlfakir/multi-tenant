import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { Slider } from '@/lib/types'

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

    let sliders = tenant.config.sliders || []
    if (!isDashboard) {
      sliders = sliders.filter((s) => (s.status ?? 'active') === 'active')
    }
    sliders = sliders.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return NextResponse.json(sliders)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sliders' },
      { status: 500 }
    )
  }
}

// POST - Create a new slider
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
    const { subdomain: bodySubdomain, ...sliderData } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (set via Host or subdomain in body)' },
        { status: 400 }
      )
    }

    if (!sliderData.image) {
      return NextResponse.json(
        { error: 'Image is required' },
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

    const sliders = tenant.config.sliders || []

    // Create new slider
    const newSlider: Slider = {
      id: `slider-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: sliderData.title || '',
      description: sliderData.description || '',
      image: sliderData.image,
      link: sliderData.link || '',
      buttonText: sliderData.buttonText || 'Learn More',
      order: sliderData.order ?? sliders.length,
      status: sliderData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    sliders.push(newSlider)

    const updatedTenant = await updateTenantConfig(subdomain, {
      sliders,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to create slider' },
        { status: 500 }
      )
    }

    return NextResponse.json(newSlider, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create slider' },
      { status: 500 }
    )
  }
}
