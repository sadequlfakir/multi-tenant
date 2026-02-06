// In-memory cache for tenant resolution (Edge Runtime compatible)
// - tenantCache: subdomain -> true
// - customDomainMap: verified custom domain (host) -> subdomain
const tenantCache = new Map<string, boolean>()
const customDomainMap = new Map<string, string>()

function key(subdomain: string) {
  return (subdomain ?? '').toLowerCase().trim()
}

function normalizeHost(host: string): string {
  return (host ?? '').split(':')[0].trim().toLowerCase()
}

export function cacheTenant(subdomain: string) {
  tenantCache.set(key(subdomain), true)
}

export function cacheCustomDomain(domain: string, subdomain: string) {
  if (!domain || !subdomain) return
  customDomainMap.set(normalizeHost(domain), key(subdomain))
  tenantCache.set(key(subdomain), true)
}

export function removeTenantFromCache(subdomain: string) {
  tenantCache.delete(key(subdomain))
  const k = key(subdomain)
  for (const [domain, sub] of customDomainMap) {
    if (sub === k) customDomainMap.delete(domain)
  }
}

export function isTenantCached(subdomain: string): boolean {
  return tenantCache.has(key(subdomain)) && tenantCache.get(key(subdomain)) === true
}

export function clearCache() {
  tenantCache.clear()
  customDomainMap.clear()
}

/**
 * Resolve tenant subdomain from request host (and optional path segment for localhost).
 * Used by middleware to set x-tenant-subdomain and to decide rewrites.
 */
export function getSubdomainByHost(host: string, pathFirstSegment?: string): string | null {
  const hostNorm = normalizeHost(host)
  if (!hostNorm) return null

  // Known custom domain (verified) takes precedence
  if (customDomainMap.has(hostNorm)) {
    const sub = customDomainMap.get(hostNorm)!
    return isTenantCached(sub) ? sub : null
  }

  // Main localhost: tenant comes from path, e.g. /shop/... -> shop
  const isMainLocalhost = hostNorm === 'localhost'
  if (isMainLocalhost && pathFirstSegment) {
    const sub = key(pathFirstSegment)
    return isTenantCached(sub) ? sub : null
  }

  // Subdomain from host: shop.localhost, shop.example.com -> shop
  const parts = hostNorm.split('.')
  const sub = (parts[0] ?? '').trim()
  if (sub === 'www' || !sub) return null
  return isTenantCached(sub) ? sub : null
}

/**
 * Check if the host looks like a tenant request (subdomain or path-based) so we can show tenant-not-found when invalid.
 */
export function isTenantRequest(host: string, pathFirstSegment?: string): boolean {
  const hostNorm = normalizeHost(host)
  if (hostNorm === 'localhost' && pathFirstSegment) return true
  const parts = hostNorm.split('.')
  const sub = (parts[0] ?? '').trim()
  return sub !== 'www' && sub.length > 0
}

// Populate cache with all tenants (subdomains + verified custom domains). Returns true if any tenants were loaded.
export async function populateCache(): Promise<boolean> {
  try {
    const { getAllTenants } = await import('./tenant-store')
    const tenants = await getAllTenants()
    tenants.forEach((tenant) => {
      tenantCache.set(key(tenant.subdomain), true)
      const domain = tenant.config?.customDomain
      if (domain && tenant.config?.customDomainVerified) {
        customDomainMap.set(normalizeHost(domain), key(tenant.subdomain))
      }
    })
    return tenants.length > 0
  } catch {
    return false
  }
}
