import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readCustomerAccounts, writeCustomerAccounts } from '@/lib/storage'
import { comparePassword, hashPassword } from '@/lib/password'

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
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Verify current password
    const passwordMatch = await comparePassword(currentPassword, result.account.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Update password
    const customerAccounts = await readCustomerAccounts()
    const accountIndex = customerAccounts.findIndex(a => a.id === result.account.id)
    
    if (accountIndex === -1) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const hashedPassword = await hashPassword(newPassword)
    customerAccounts[accountIndex].password = hashedPassword
    customerAccounts[accountIndex].updatedAt = new Date().toISOString()

    await writeCustomerAccounts(customerAccounts)

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Failed to change password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
