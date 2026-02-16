import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers, readAdmins, writeUsers, writeAdmins } from '@/lib/storage'
import { hashPassword, comparePassword } from '@/lib/password'

/**
 * POST /api/auth/change-password
 * Change password for authenticated user/admin.
 * Body: { currentPassword: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const passwordMatch = await comparePassword(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    if ('role' in user) {
      // Admin
      const admins = await readAdmins()
      const adminIndex = admins.findIndex((a) => a.id === user.id)
      if (adminIndex === -1) {
        return NextResponse.json(
          { error: 'Admin not found' },
          { status: 404 }
        )
      }
      admins[adminIndex].password = hashedPassword
      admins[adminIndex].updatedAt = new Date().toISOString()
      await writeAdmins(admins)
    } else {
      // User
      const users = await readUsers()
      const userIndex = users.findIndex((u) => u.id === user.id)
      if (userIndex === -1) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      users[userIndex].password = hashedPassword
      users[userIndex].updatedAt = new Date().toISOString()
      await writeUsers(users)
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been changed successfully',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
