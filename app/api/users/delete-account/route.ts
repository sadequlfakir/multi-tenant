import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { deleteUserAccount } from '@/lib/storage'
import { removeTenantFromCache } from '@/lib/tenant-cache'

/**
 * POST /api/users/delete-account
 * Deletes the authenticated user's account and all related data:
 * - All sessions for this user
 * - Their tenant (site) and all its orders and customers
 * - The user record
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

    const { subdomain } = await deleteUserAccount(user.id)
    if (subdomain) {
      removeTenantFromCache(subdomain)
    }

    return NextResponse.json({ success: true, message: 'Account and all related data deleted' })
  } catch (error) {
    console.error('Delete account error:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
