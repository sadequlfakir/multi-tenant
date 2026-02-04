// Simple in-memory cache for tenant subdomains
// Used by middleware (Edge Runtime compatible)
const tenantCache = new Map<string, boolean>()

export function cacheTenant(subdomain: string) {
  tenantCache.set(subdomain, true)
}

export function removeTenantFromCache(subdomain: string) {
  tenantCache.delete(subdomain)
}

export function isTenantCached(subdomain: string): boolean {
  return tenantCache.has(subdomain) && tenantCache.get(subdomain) === true
}

export function clearCache() {
  tenantCache.clear()
}

// Populate cache with all tenants (called on startup)
export async function populateCache() {
  try {
    // Only populate if we're in Node.js runtime
    if (typeof process !== 'undefined' && process.cwd) {
      const { getAllTenants } = await import('./tenant-store')
      const tenants = await getAllTenants()
      tenants.forEach(tenant => {
        tenantCache.set(tenant.subdomain, true)
      })
    }
  } catch (error) {
    // Silently fail in Edge Runtime
  }
}
