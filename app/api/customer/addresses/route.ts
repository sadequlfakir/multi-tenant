import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readCustomerAddresses, writeCustomerAddresses } from '@/lib/storage'
import type { CustomerAddress } from '@/lib/types'

// GET - List all addresses for the authenticated customer
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

    const addresses = await readCustomerAddresses()
    const customerAddresses = addresses.filter(
      addr => addr.customerId === result.customer.id && addr.tenantId === result.account.tenantId
    )

    // Sort: default first, then by created date
    customerAddresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(customerAddresses)
  } catch (error) {
    console.error('Failed to fetch addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

// POST - Create a new address
export async function POST(request: NextRequest) {
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
    const { name, address, city, state, zipCode, country, phone, isDefault } = body

    if (!name || !address || !city || !zipCode) {
      return NextResponse.json(
        { error: 'Name, address, city, and zip code are required' },
        { status: 400 }
      )
    }

    const addresses = await readCustomerAddresses()
    
    // If this is set as default, unset other defaults
    if (isDefault) {
      const customerAddresses = addresses.filter(
        addr => addr.customerId === result.customer.id && addr.tenantId === result.account.tenantId
      )
      for (const addr of customerAddresses) {
        if (addr.isDefault) {
          addr.isDefault = false
          addr.updatedAt = new Date().toISOString()
        }
      }
    }

    const newAddress: CustomerAddress = {
      id: `address-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      customerId: result.customer.id,
      tenantId: result.account.tenantId,
      name,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault: isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addresses.push(newAddress)
    await writeCustomerAddresses(addresses)

    return NextResponse.json(newAddress, { status: 201 })
  } catch (error) {
    console.error('Failed to create address:', error)
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    )
  }
}
