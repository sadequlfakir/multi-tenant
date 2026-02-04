import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { Banner } from '@/lib/types'
import { isCloudinaryUrl, deleteByUrl } from '@/lib/cloudinary'

// GET - Get a single banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
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

    const banners = tenant.config.banners || []
    const banner = banners.find(b => b.id === id)

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(banner)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    )
  }
}

// PUT - Update a banner
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
    const { subdomain, ...bannerData } = body

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      )
    }

    if (bannerData.position && !['after-categories', 'after-products'].includes(bannerData.position)) {
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
    const bannerIndex = banners.findIndex(b => b.id === id)

    if (bannerIndex === -1) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    const oldImage = banners[bannerIndex].image
    const newImage = bannerData.image
    if (oldImage && newImage !== oldImage && isCloudinaryUrl(oldImage)) {
      await deleteByUrl(oldImage)
    }

    // Update banner
    const updatedBanner: Banner = {
      ...banners[bannerIndex],
      ...bannerData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    }

    banners[bannerIndex] = updatedBanner

    const updatedTenant = await updateTenantConfig(subdomain, {
      banners,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to update banner' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedBanner)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a banner
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

    const searchParams = request.nextUrl.searchParams
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
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
    const banner = banners.find(b => b.id === id)
    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    if (banner.image && isCloudinaryUrl(banner.image)) {
      await deleteByUrl(banner.image)
    }

    const filteredBanners = banners.filter(b => b.id !== id)
    const updatedTenant = await updateTenantConfig(subdomain, {
      banners: filteredBanners,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to delete banner' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}
