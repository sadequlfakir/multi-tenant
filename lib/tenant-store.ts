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
    {
      id: 'tenant-1',
      name: 'Demo Shop',
      subdomain: 'shop',
      template: 'ecommerce',
      config: {
        siteName: 'Demo Shop',
        siteDescription: 'Your one-stop shop for everything',
        products: [
          {
            id: '1',
            name: 'Wireless Headphones',
            description: 'Premium wireless headphones with noise cancellation',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            category: 'Electronics',
          },
          {
            id: '2',
            name: 'Smart Watch',
            description: 'Feature-rich smartwatch with health tracking',
            price: 299.99,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            category: 'Electronics',
          },
          {
            id: '3',
            name: 'Laptop Stand',
            description: 'Ergonomic aluminum laptop stand',
            price: 49.99,
            image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
            category: 'Accessories',
          },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tenant-2',
      name: 'John Doe Portfolio',
      subdomain: 'john',
      template: 'portfolio',
      config: {
        siteName: 'John Doe - Web Developer',
        siteDescription: 'Creative web developer and designer',
        about: 'I am a passionate web developer with 5+ years of experience building modern web applications. I specialize in React, Next.js, and TypeScript.',
        contactEmail: 'john@example.com',
        projects: [
          {
            id: '1',
            title: 'E-Commerce Platform',
            description: 'A full-featured e-commerce platform built with Next.js and Stripe',
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500',
            link: 'https://example.com',
            technologies: ['Next.js', 'TypeScript', 'Stripe'],
          },
          {
            id: '2',
            title: 'Task Management App',
            description: 'Collaborative task management application with real-time updates',
            image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500',
            link: 'https://example.com',
            technologies: ['React', 'Node.js', 'WebSocket'],
          },
          {
            id: '3',
            title: 'Weather Dashboard',
            description: 'Beautiful weather dashboard with location-based forecasts',
            image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=500',
            link: 'https://example.com',
            technologies: ['Vue.js', 'API Integration'],
          },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
  
  await writeTenants(demoTenants)
  
  // Cache demo tenants
  demoTenants.forEach(tenant => cacheTenant(tenant.subdomain))
}

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  await initializeDemoTenants()
  const tenants = await readTenants()
  return tenants.find(t => t.subdomain === subdomain) || null
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
  config: Partial<TenantConfig> = {}
): Promise<Tenant> {
  await initializeDemoTenants()
  const tenants = await readTenants()
  
  // Check if subdomain already exists
  if (tenants.some(t => t.subdomain === subdomain)) {
    throw new Error('Subdomain already exists')
  }
  
  const tenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name,
    subdomain,
    template,
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
  // Cache the tenant for middleware
  cacheTenant(subdomain)
  return tenant
}

export async function updateTenantConfig(
  subdomain: string,
  config: Partial<TenantConfig>
): Promise<Tenant | null> {
  await initializeDemoTenants()
  const tenants = await readTenants()
  const tenantIndex = tenants.findIndex(t => t.subdomain === subdomain)
  
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
