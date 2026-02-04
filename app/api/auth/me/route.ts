import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const user = await getAuthenticatedUser(token)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const isAdmin = 'password' in user && 'role' in user
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: isAdmin ? 'admin' : 'user',
      tenantId: isAdmin ? undefined : (user as any).tenantId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
