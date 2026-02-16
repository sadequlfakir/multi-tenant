import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readCustomers, writeCustomers } from '@/lib/storage'

// GET - Get customer profile
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
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

// PUT - Update customer profile
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { name, phone } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const customers = await readCustomers()
    const customerIndex = customers.findIndex(c => c.id === result.customer.id)
    
    if (customerIndex === -1) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Update customer
    customers[customerIndex].name = name
    if (phone !== undefined) {
      customers[customerIndex].phone = phone || undefined
    }
    customers[customerIndex].updatedAt = new Date().toISOString()

    await writeCustomers(customers)

    return NextResponse.json({
      id: customers[customerIndex].id,
      name: customers[customerIndex].name,
      email: customers[customerIndex].email,
      phone: customers[customerIndex].phone,
    })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
