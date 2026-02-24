import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { isCloudinaryUrl, deleteByUrl } from '@/lib/cloudinary'

// Get tenant settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check if user owns this tenant (dashboard user).
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      const ownsByLegacyTenantId = userData?.tenantId === tenant.id
      const ownsByOwnerField = (tenant as any).ownerUserId === user.id
      if (!ownsByLegacyTenantId && !ownsByOwnerField) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(tenant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

// Update tenant settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check if user owns this tenant (dashboard user).
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      const ownsByLegacyTenantId = userData?.tenantId === tenant.id
      const ownsByOwnerField = (tenant as any).ownerUserId === user.id
      if (!ownsByLegacyTenantId && !ownsByOwnerField) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const configUpdate = body.config ?? body

    if (configUpdate.logo !== undefined && configUpdate.logo !== tenant.config.logo && tenant.config.logo && isCloudinaryUrl(tenant.config.logo)) {
      await deleteByUrl(tenant.config.logo)
    }
    if (configUpdate.favicon !== undefined && configUpdate.favicon !== tenant.config.favicon && tenant.config.favicon && isCloudinaryUrl(tenant.config.favicon)) {
      await deleteByUrl(tenant.config.favicon)
    }

    const updatedTenant = await updateTenantConfig(subdomain, configUpdate)

    if (!updatedTenant) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(updatedTenant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
