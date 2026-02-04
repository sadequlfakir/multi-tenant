import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { Slider } from '@/lib/types'
import { isCloudinaryUrl, deleteByUrl } from '@/lib/cloudinary'

// GET - Get a single slider
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

    const sliders = tenant.config.sliders || []
    const slider = sliders.find(s => s.id === id)

    if (!slider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(slider)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch slider' },
      { status: 500 }
    )
  }
}

// PUT - Update a slider
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
    const { subdomain, ...sliderData } = body

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

    const sliders = tenant.config.sliders || []
    const sliderIndex = sliders.findIndex(s => s.id === id)

    if (sliderIndex === -1) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }

    const oldImage = sliders[sliderIndex].image
    const newImage = sliderData.image
    if (oldImage && newImage !== oldImage && isCloudinaryUrl(oldImage)) {
      await deleteByUrl(oldImage)
    }

    // Update slider
    const updatedSlider: Slider = {
      ...sliders[sliderIndex],
      ...sliderData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    }

    sliders[sliderIndex] = updatedSlider

    const updatedTenant = await updateTenantConfig(subdomain, {
      sliders,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to update slider' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedSlider)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update slider' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a slider
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

    const sliders = tenant.config.sliders || []
    const slider = sliders.find(s => s.id === id)
    if (!slider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }

    if (slider.image && isCloudinaryUrl(slider.image)) {
      await deleteByUrl(slider.image)
    }

    const filteredSliders = sliders.filter(s => s.id !== id)
    const updatedTenant = await updateTenantConfig(subdomain, {
      sliders: filteredSliders,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to delete slider' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete slider' },
      { status: 500 }
    )
  }
}
