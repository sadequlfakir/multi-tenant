import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  let res: NextResponse
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      res = NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
      return withCors(res, request)
    }

    const user = await getAuthenticatedUser(token)
    
    if (!user) {
      res = NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
      return withCors(res, request)
    }

    const isAdmin = 'password' in user && 'role' in user
    
    res = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: isAdmin ? 'admin' : 'user',
      tenantId: isAdmin ? undefined : (user as any).tenantId,
    })
    return withCors(res, request)
  } catch (error) {
    res = NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
    return withCors(res, request)
  }
}
