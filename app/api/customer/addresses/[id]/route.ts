import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readCustomerAddresses, writeCustomerAddresses } from '@/lib/storage'
import type { CustomerAddress } from '@/lib/types'

// PUT - Update an address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const addresses = await readCustomerAddresses()
    const addressIndex = addresses.findIndex(
      addr => addr.id === id && addr.customerId === result.customer.id && addr.tenantId === result.account.tenantId
    )

    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    const existingAddress = addresses[addressIndex]

    // If this is set as default, unset other defaults
    if (isDefault && !existingAddress.isDefault) {
      const customerAddresses = addresses.filter(
        addr => addr.customerId === result.customer.id && addr.tenantId === result.account.tenantId && addr.id !== id
      )
      for (const addr of customerAddresses) {
        if (addr.isDefault) {
          addr.isDefault = false
          addr.updatedAt = new Date().toISOString()
        }
      }
    }

    // Update address
    addresses[addressIndex] = {
      ...existingAddress,
      name: name ?? existingAddress.name,
      address: address ?? existingAddress.address,
      city: city ?? existingAddress.city,
      state: state ?? existingAddress.state,
      zipCode: zipCode ?? existingAddress.zipCode,
      country: country ?? existingAddress.country,
      phone: phone ?? existingAddress.phone,
      isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
      updatedAt: new Date().toISOString(),
    }

    await writeCustomerAddresses(addresses)

    return NextResponse.json(addresses[addressIndex])
  } catch (error) {
    console.error('Failed to update address:', error)
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const addressIndex = addresses.findIndex(
      addr => addr.id === id && addr.customerId === result.customer.id && addr.tenantId === result.account.tenantId
    )

    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    addresses.splice(addressIndex, 1)
    await writeCustomerAddresses(addresses)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete address:', error)
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    )
  }
}
