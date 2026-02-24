import { Tenant, TenantConfig } from './types'
import { readTenants, writeTenants } from './storage'
import { cacheTenant } from './tenant-cache'

// Initialize demo tenants on first load
let initialized = false

async function initializeDemoTenants() {
  if (initialized) return
  initialized = true
  
  const tenants = await readTenants()
  if (tenants.length > 0) {
    // Populate cache with existing tenants
    tenants.forEach(tenant => cacheTenant(tenant.subdomain))
    return // Already has data
  }
  
  const demoTenants: Tenant[] = [
  ]
  
  await writeTenants(demoTenants)
  
  // Cache demo tenants
  demoTenants.forEach(tenant => cacheTenant(tenant.subdomain))
}

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  await initializeDemoTenants()
  const tenants = await readTenants()
  const normalized = (subdomain ?? '').toLowerCase().trim()
  if (!normalized) return null
  return tenants.find(t => (t.subdomain ?? '').toLowerCase().trim() === normalized) || null
}

export async function getTenantByCustomDomain(domain: string): Promise<Tenant | null> {
  await initializeDemoTenants()
  const tenants = await readTenants()
  return tenants.find(t => t.config.customDomain === domain && t.config.customDomainVerified) || null
}

export async function createTenant(
  name: string,
  subdomain: string,
  template: 'ecommerce' | 'portfolio',
  config: Partial<TenantConfig> = {},
  isTemplate: boolean = false,
  ownerUserId?: string
): Promise<Tenant> {
  await initializeDemoTenants()
  const tenants = await readTenants()
  
  const normalizedSubdomain = subdomain.toLowerCase().trim()
  if (tenants.some(t => (t.subdomain ?? '').toLowerCase() === normalizedSubdomain)) {
    throw new Error('Subdomain already exists')
  }
  
  const tenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name,
    subdomain: normalizedSubdomain,
    template,
    ownerUserId,
    isTemplate,
    config: {
      siteName: config.siteName || name,
      siteDescription: config.siteDescription || '',
      ...config,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  tenants.push(tenant)
  await writeTenants(tenants)
  cacheTenant(normalizedSubdomain)
  return tenant
}

export async function updateTenantConfig(
  subdomain: string,
  config: Partial<TenantConfig>
): Promise<Tenant | null> {
  await initializeDemoTenants()
  const tenants = await readTenants()
  const normalized = subdomain.toLowerCase().trim()
  const tenantIndex = tenants.findIndex(t => (t.subdomain ?? '').toLowerCase() === normalized)
  
  if (tenantIndex === -1) return null
  
  tenants[tenantIndex].config = { ...tenants[tenantIndex].config, ...config }
  tenants[tenantIndex].updatedAt = new Date().toISOString()
  await writeTenants(tenants)
  return tenants[tenantIndex]
}

export async function getAllTenants(): Promise<Tenant[]> {
  await initializeDemoTenants()
  return readTenants()
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  await initializeDemoTenants()
  const tenants = await readTenants()
  return tenants.find(t => t.id === id) || null
}
