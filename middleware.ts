import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isTenantCached, populateCache } from '@/lib/tenant-cache'

// Try to populate cache on first middleware run (if in Node.js runtime)
let cacheInitAttempted = false
async function tryPopulateCache() {
  if (cacheInitAttempted) return
  cacheInitAttempted = true
  try {
    await populateCache()
  } catch (error) {
    // Silently fail in Edge Runtime
  }
}

export async function middleware(request: NextRequest) {
  // Try to populate cache (will only work in Node.js runtime)
  await tryPopulateCache()
  
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Check if it's exactly localhost (no subdomain) or localhost:port
  const isMainLocalhost = hostname === 'localhost' || hostname.startsWith('localhost:')
  
  if (isMainLocalhost) {
    // For main localhost, check if path starts with a tenant subdomain
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts.length > 0) {
      const potentialSubdomain = pathParts[0]
      
      // Skip known non-tenant paths
      const skipPaths = ['admin', 'user', 'api', '_next', 'favicon.ico']
      if (skipPaths.includes(potentialSubdomain)) {
        return NextResponse.next()
      }
      
      const exists = isTenantCached(potentialSubdomain)
      
      if (exists) {
        // Rewrite to tenant route structure
        const remainingPath = pathParts.slice(1).join('/')
        url.pathname = remainingPath ? `/${potentialSubdomain}/${remainingPath}` : `/${potentialSubdomain}`
        return NextResponse.rewrite(url)
      }
      
      // If not in cache, allow through - page will handle tenant lookup and cache it
      // This allows the system to work even if cache isn't populated yet
      const remainingPath = pathParts.slice(1).join('/')
      url.pathname = remainingPath ? `/${potentialSubdomain}/${remainingPath}` : `/${potentialSubdomain}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }
  
  // Extract subdomain from hostname
  // Examples: 
  // - myecom.localhost:3000 -> myecom
  // - shop.example.com -> shop
  // - www.example.com -> www
  const hostnameWithoutPort = hostname.split(':')[0]
  const parts = hostnameWithoutPort.split('.')
  const subdomain = parts[0]
  
  // Skip www and empty subdomains
  if (subdomain === 'www' || !subdomain) {
    return NextResponse.next()
  }
  
  // Check if subdomain is a valid tenant
  const exists = isTenantCached(subdomain)
  
  if (exists) {
    // Rewrite the URL to use the tenant route structure
    url.pathname = url.pathname === '/' 
      ? `/${subdomain}` 
      : `/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }
  
  // If not in cache but looks like a subdomain, allow through
  // The page will verify and handle 404 if needed
  // This makes the system work even if cache isn't warm
  url.pathname = url.pathname === '/' 
    ? `/${subdomain}` 
    : `/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

