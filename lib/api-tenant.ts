import type { NextRequest } from 'next/server'

/**
 * Resolve tenant subdomain for API routes.
 * Uses x-tenant-subdomain (set by middleware from Host) first, then query param for backward compatibility.
 */
export function getTenantSubdomainFromRequest(request: NextRequest): string | null {
  const header = request.headers.get('x-tenant-subdomain')
  if (header && header.trim()) {
    return header.trim().toLowerCase()
  }
  const query = request.nextUrl.searchParams.get('subdomain')
  if (query && query.trim()) {
    return query.trim().toLowerCase()
  }
  return null
}
