import { NextRequest, NextResponse } from 'next/server'
import { findPasswordResetToken, markPasswordResetTokenAsUsed, readUsers, readAdmins, writeUsers, writeAdmins } from '@/lib/storage'
import { hashPassword } from '@/lib/password'

/**
 * POST /api/auth/reset-password
 * Reset password using a reset token.
 * Body: { token: string, newPassword: string, type: 'user' | 'admin' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword, type } = body

    if (!token || !newPassword || !type) {
      return NextResponse.json(
        { error: 'Token, new password, and type are required' },
        { status: 400 }
      )
    }

    if (type !== 'user' && type !== 'admin') {
      return NextResponse.json(
        { error: 'Type must be "user" or "admin"' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Find token
    const resetToken = await findPasswordResetToken(token)
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Check if token is already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'This reset token has already been used' },
        { status: 400 }
      )
    }

    // Verify user type matches
    if (resetToken.userType !== type) {
      return NextResponse.json(
        { error: 'Invalid token for this user type' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    if (type === 'user') {
      const users = await readUsers()
      const userIndex = users.findIndex((u) => u.id === resetToken.userId)
      if (userIndex === -1) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      users[userIndex].password = hashedPassword
      users[userIndex].updatedAt = new Date().toISOString()
      await writeUsers(users)
    } else {
      const admins = await readAdmins()
      const adminIndex = admins.findIndex((a) => a.id === resetToken.userId)
      if (adminIndex === -1) {
        return NextResponse.json(
          { error: 'Admin not found' },
          { status: 404 }
        )
      }
      admins[adminIndex].password = hashedPassword
      admins[adminIndex].updatedAt = new Date().toISOString()
      await writeAdmins(admins)
    }

    // Mark token as used
    await markPasswordResetTokenAsUsed(token)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
