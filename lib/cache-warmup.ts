import { getAllTenants } from './tenant-store'
import { cacheTenant } from './tenant-cache'

let warmed = false

// Warm up the cache with all tenants
export async function warmupCache() {
  if (warmed) return
  
  try {
    const tenants = await getAllTenants()
    tenants.forEach(tenant => {
      cacheTenant(tenant.subdomain)
    })
    warmed = true
  } catch (error) {
    // Silently fail - cache will be populated on-demand
  }
}
