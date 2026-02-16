import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const result = await getAuthenticatedCustomer(token)
    
    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      id: result.customer.id,
      name: result.customer.name,
      email: result.customer.email,
      phone: result.customer.phone,
      tenantId: result.account.tenantId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get customer' },
      { status: 500 }
    )
  }
}
