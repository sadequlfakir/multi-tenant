import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSubdomainByHost, isTenantRequest, populateCache } from '@/lib/tenant-cache'

let cacheHasTenants = false
let populateAttempted = false

async function tryPopulateCache() {
  if (populateAttempted) return
  populateAttempted = true
  cacheHasTenants = await populateCache()
}

export async function middleware(request: NextRequest) {
  await tryPopulateCache()

  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const pathParts = url.pathname.split('/').filter(Boolean)
  const pathFirst = pathParts[0]
  const isApi = url.pathname.startsWith('/api')

  // Resolve tenant from host (custom domain or subdomain) or from path (localhost/shop -> shop)
  let resolvedSubdomain = getSubdomainByHost(hostname, pathFirst ?? undefined)

  // API: when Host is localhost, tenant may come from Referer (e.g. page at /shop/... calling /api/products)
  if (isApi && !resolvedSubdomain) {
    const referer = request.headers.get('referer')
    if (referer) {
      try {
        const refUrl = new URL(referer)
        const refPath = refUrl.pathname.replace(/^\/+/, '').split('/')
        if (refPath[0] && refPath[0] !== 'api' && refPath[0] !== 'admin' && refPath[0] !== 'user') {
          resolvedSubdomain = getSubdomainByHost(refUrl.host, refPath[0])
        }
      } catch {
        // ignore
      }
    }
  }

  // API: set header when we have a tenant so routes don't need subdomain in query
  if (isApi) {
    const res = NextResponse.next()
    if (resolvedSubdomain) {
      res.headers.set('x-tenant-subdomain', resolvedSubdomain)
    }
    return res
  }

  // Already on tenant-not-found: let it through so the page is served (avoids redirect loop)
  if (pathFirst === 'tenant-not-found') {
    return NextResponse.next()
  }

  const isMainLocalhost = hostname === 'localhost' || hostname.startsWith('localhost:')
  const skipPaths = ['admin', 'user', 'api', '_next', 'favicon.ico', 'tenant-not-found']

  if (isMainLocalhost) {
    if (!pathFirst || skipPaths.includes(pathFirst)) {
      return NextResponse.next()
    }
    // Path-based tenant: /shop/... -> shop
    if (resolvedSubdomain) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = pathParts.length > 1 ? `/${resolvedSubdomain}/${pathParts.slice(1).join('/')}` : `/${resolvedSubdomain}`
      const res = NextResponse.rewrite(rewriteUrl)
      res.headers.set('x-tenant-subdomain', resolvedSubdomain)
      return res
    }
    // Tenant request but not found: rewrite to tenant-not-found (no redirect, URL unchanged)
    if (cacheHasTenants && isTenantRequest(hostname, pathFirst)) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = '/tenant-not-found'
      return NextResponse.rewrite(rewriteUrl)
    }
    // Cache cold: allow through so page can try and show notFound()
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = pathParts.length > 1 ? `/${pathFirst}/${pathParts.slice(1).join('/')}` : `/${pathFirst}`
    return NextResponse.rewrite(rewriteUrl)
  }

  // Host-based: subdomain (shop.localhost, shop.example.com) or custom domain
  const hostNorm = hostname.split(':')[0].trim().toLowerCase()
  const parts = hostNorm.split('.')
  const subdomain = (parts[0] ?? '').trim()

  if (subdomain === 'www' || !subdomain) {
    return NextResponse.next()
  }

  if (resolvedSubdomain) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = url.pathname === '/' ? `/${resolvedSubdomain}` : `/${resolvedSubdomain}${url.pathname}`
    const res = NextResponse.rewrite(rewriteUrl)
    res.headers.set('x-tenant-subdomain', resolvedSubdomain)
    return res
  }

  // Invalid tenant (host-based): rewrite to tenant-not-found (no redirect, URL unchanged)
  if (cacheHasTenants && isTenantRequest(hostname)) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = '/tenant-not-found'
    return NextResponse.rewrite(rewriteUrl)
  }

  url.pathname = url.pathname === '/' ? `/${subdomain}` : `/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/',
    '/tenant-not-found',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
