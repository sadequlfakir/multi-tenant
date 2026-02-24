import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getAllTenants } from '@/lib/tenant-store'

// Return all sites owned by the currently authenticated dashboard user.
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getAuthenticatedUser(token)
  if (!user || 'role' in user) {
    // Only regular dashboard users have owned sites
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenants = await getAllTenants()
  const owned = tenants.filter(
    (t) =>
      t.ownerUserId === user.id ||
      // Backwards compatibility: fall back to legacy single-tenant field
      (t.ownerUserId == null && (user as any).tenantId === t.id)
  )

  return NextResponse.json(owned)
}

