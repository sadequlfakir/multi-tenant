import { Tenant } from './types'

/**
 * Detects if the current request is using subdomain routing or path routing
 */
export function isSubdomainMode(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: always return false, middleware handles it
    return false
  }
  
  // Client-side: check current hostname
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  
  // If hostname has multiple parts and first part is not 'localhost' or 'www', it's subdomain mode
  // Examples: 
  // - myecom.localhost -> subdomain mode (parts: ['myecom', 'localhost'])
  // - localhost -> path mode (parts: ['localhost'])
  // - shop.example.com -> subdomain mode (parts: ['shop', 'example', 'com'])
  if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') {
    return true
  }
  
  // Special case: if it's exactly 'localhost' or starts with 'localhost:', it's path mode
  if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
    return false
  }
  
  return false
}

/**
 * Generates a link that works in both subdomain and path modes
 * @param tenant - The tenant object
 * @param path - The path relative to tenant root (e.g., '/products', '/cart', '/products/123')
 * @returns The correct link based on current routing mode
 */
export function getTenantLink(tenant: Tenant, path: string = ''): string {
  if (typeof window === 'undefined') {
    // Server-side: use path-based (middleware will handle rewrite for subdomains)
    return `/${tenant.subdomain}${path}`
  }
  
  // Client-side: detect mode
  const isSubdomain = isSubdomainMode()
  
  if (isSubdomain) {
    // In subdomain mode, just use the path (subdomain is already in URL)
    // Ensure path starts with / or is empty
    return path || '/'
  } else {
    // In path mode, include subdomain in path
    return `/${tenant.subdomain}${path}`
  }
}

/**
 * Generates the full URL to visit a tenant's live site
 * Always uses subdomain format for better UX
 * @param tenant - The tenant object
 * @param path - Optional path to append
 * @returns Full URL (e.g., http://mysite.localhost:3000)
 */
export function getTenantSiteUrl(tenant: Tenant, path: string = ''): string {
  if (typeof window === 'undefined') {
    // Server-side: default to subdomain format
    const port = process.env.PORT || '3000'
    return `http://${tenant.subdomain}.localhost:${port}${path}`
  }
  
  // Client-side: always generate subdomain URL
  const hostname = window.location.hostname
  const port = window.location.port ? `:${window.location.port}` : ''
  const protocol = window.location.protocol
  
  // Extract base domain from current hostname
  // Examples:
  // - localhost -> localhost
  // - myecom.localhost -> localhost
  // - example.com -> example.com
  const parts = hostname.split('.')
  let baseDomain = 'localhost'
  
  if (parts.length > 1) {
    // If already has subdomain, extract base domain
    if (parts[parts.length - 1] === 'localhost') {
      baseDomain = 'localhost'
    } else {
      // For real domains, take last 2 parts (e.g., example.com)
      baseDomain = parts.slice(-2).join('.')
    }
  } else {
    // Single part hostname (e.g., localhost)
    baseDomain = hostname
  }
  
  // Always generate subdomain URL
  return `${protocol}//${tenant.subdomain}.${baseDomain}${port}${path}`
}

/**
 * Hook for use in client components to get tenant link helper
 */
export function useTenantLink(tenant: Tenant) {
  return (path: string = '') => getTenantLink(tenant, path)
}

/**
 * When on a tenant subdomain (e.g. myecom.localhost), returns the main app origin
 * so links to /user/dashboard, /user/products etc. work.
 */
export function getMainAppUrl(path: string = ''): string {
  if (typeof window === 'undefined') {
    return path ? path : '/'
  }
  const hostname = window.location.hostname
  const port = window.location.port ? `:${window.location.port}` : ''
  const protocol = window.location.protocol
  const isSubdomain = hostname !== 'localhost' && hostname.endsWith('.localhost')
  if (isSubdomain) {
    return `${protocol}//localhost${port}${path ? path : ''}`
  }
  return path || '/'
}
