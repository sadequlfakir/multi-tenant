import { NextRequest, NextResponse } from 'next/server'

export function allowOrigin(origin: string | null): string | null {
  if (!origin) return null
  try {
    const host = new URL(origin).hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.localhost')) return origin
  } catch {
    // ignore
  }
  return null
}

export function withCors(res: NextResponse, request: NextRequest): NextResponse {
  const origin = allowOrigin(request.headers.get('origin'))
  if (origin) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  return res
}
