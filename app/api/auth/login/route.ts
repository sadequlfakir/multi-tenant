import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin, authenticateUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, type } = body

    if (!email || !password || !type) {
      return NextResponse.json(
        { error: 'Email, password, and type are required' },
        { status: 400 }
      )
    }

    let result
    if (type === 'admin') {
      result = await authenticateAdmin(email, password)
    } else {
      result = await authenticateUser(email, password)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      token: result.token,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        role: type,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    )
  }
}
