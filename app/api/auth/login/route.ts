import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin, authenticateUser } from '@/lib/auth'
import { allowOrigin, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  const origin = allowOrigin(request.headers.get('origin'))
  const res = new NextResponse(null, { status: 204 })
  if (origin) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  return res
}

export async function POST(request: NextRequest) {
  let res: NextResponse
  try {
    const body = await request.json()
    const { email, password, type } = body

    if (!email || !password || !type) {
      res = NextResponse.json(
        { error: 'Email, password, and type are required' },
        { status: 400 }
      )
      return withCors(res, request)
    }

    let result
    if (type === 'admin') {
      result = await authenticateAdmin(email, password)
    } else {
      result = await authenticateUser(email, password)
    }

    if (!result.success) {
      res = NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      )
      return withCors(res, request)
    }

    res = NextResponse.json({
      token: result.token,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        role: type,
      },
    })
    return withCors(res, request)
  } catch (error) {
    res = NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    )
    return withCors(res, request)
  }
}
