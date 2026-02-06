import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { deleteUserAccount } from '@/lib/storage'
import { removeTenantFromCache } from '@/lib/tenant-cache'
import { getTenantById } from '@/lib/tenant-store'
import { getSupabase } from '@/lib/supabase'
import { isCloudinaryUrl, deleteByUrl } from '@/lib/cloudinary'

/**
 * Collect all Cloudinary image URLs from a tenant (config + products table) for cleanup on account delete.
 */
async function collectTenantImageUrls(tenantId: string, config: import('@/lib/types').TenantConfig): Promise<Set<string>> {
  const urls = new Set<string>()
  const add = (url: string | undefined) => {
    if (url && typeof url === 'string' && url.trim()) urls.add(url.trim())
  }

  add(config.logo)
  add(config.favicon)
  ;(config.products || []).forEach((p) => add(p.image))
  ;(config.categories || []).forEach((c) => add(c.image))
  ;(config.sliders || []).forEach((s) => add(s.image))
  ;(config.banners || []).forEach((b) => add(b.image))

  const sb = getSupabase()
  if (sb) {
    const { data: products } = await sb.from('products').select('image').eq('tenant_id', tenantId)
    ;(products || []).forEach((p: { image?: string }) => add(p.image))
  }

  return urls
}

/**
 * POST /api/users/delete-account
 * Deletes the authenticated user's account and all related data:
 * - All sessions for this user
 * - Their tenant (site), its orders, customers, and products
 * - The user record
 * - All Cloudinary images belonging to the tenant (logo, favicon, product/category/slider/banner/collection images)
 * Requires: Authorization: Bearer <token>, and user must be a regular user (not admin).
 */
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

    // Only regular users can delete their own account (not admins via this route)
    if ('role' in user && (user.role === 'super_admin' || user.role === 'admin')) {
      return NextResponse.json({ error: 'Admins cannot delete account via this endpoint' }, { status: 403 })
    }

    const tenantId = 'tenantId' in user ? (user as { tenantId?: string }).tenantId : null
    let imageUrlsToDelete = new Set<string>()
    if (tenantId) {
      const tenant = await getTenantById(tenantId)
      if (tenant) {
        imageUrlsToDelete = await collectTenantImageUrls(tenant.id, tenant.config)
      }
    }

    const { subdomain } = await deleteUserAccount(user.id)
    if (subdomain) {
      removeTenantFromCache(subdomain)
    }

    // Delete Cloudinary images so they are not left orphaned
    const cloudinaryUrls = [...imageUrlsToDelete].filter(isCloudinaryUrl)
    await Promise.allSettled(cloudinaryUrls.map((url) => deleteByUrl(url)))
    if (cloudinaryUrls.length > 0) {
      console.log(`Delete account: removed ${cloudinaryUrls.length} Cloudinary image(s) for tenant ${tenantId ?? 'none'}`)
    }

    return NextResponse.json({ success: true, message: 'Account and all related data deleted' })
  } catch (error) {
    console.error('Delete account error:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
