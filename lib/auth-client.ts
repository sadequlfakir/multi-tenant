/**
 * Client-side auth helpers. Use getAuthToken() so auth works on both
 * main app (localhost) and tenant subdomains (myecom.localhost) via cookie.
 */

const TOKEN_KEY = 'userToken'
const COOKIE_MAX_AGE_DAYS = 7

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function isLocalhostish(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost')
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const fromStorage = localStorage.getItem(TOKEN_KEY)
  if (fromStorage) return fromStorage
  return getCookie(TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  const hostname = window.location.hostname
  if (isLocalhostish(hostname)) {
    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
    // Domain=.localhost so subdomains (myecom.localhost) receive the cookie
    try {
      document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; domain=.localhost; max-age=${maxAge}; SameSite=Lax`
    } catch {
      // some browsers may reject .localhost
    }
  }
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
  try {
    document.cookie = `${TOKEN_KEY}=; path=/; domain=.localhost; max-age=0`
  } catch {}
}
