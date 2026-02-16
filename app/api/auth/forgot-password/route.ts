import { NextRequest, NextResponse } from 'next/server'
import { readUsers, readAdmins, createPasswordResetToken } from '@/lib/storage'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'

/**
 * POST /api/auth/forgot-password
 * Request password reset. Generates a token and sends reset email.
 * Body: { email: string, type: 'user' | 'admin' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type } = body

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      )
    }

    if (type !== 'user' && type !== 'admin') {
      return NextResponse.json(
        { error: 'Type must be "user" or "admin"' },
        { status: 400 }
      )
    }

    // Find user/admin by email
    let userId: string | null = null
    let userName: string | null = null

    if (type === 'user') {
      const users = await readUsers()
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (user) {
        userId = user.id
        userName = user.name
      }
    } else {
      const admins = await readAdmins()
      const admin = admins.find((a) => a.email.toLowerCase() === email.toLowerCase())
      if (admin) {
        userId = admin.id
        userName = admin.name
      }
    }

    // Always return success to prevent email enumeration
    // In production, you might want to rate limit this endpoint
    if (!userId) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Create reset token
    const resetToken = await createPasswordResetToken(userId, type)

    // Generate reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (request.headers.get('origin') || 'http://localhost:3000')
    const resetUrl = `${baseUrl}/user/reset-password?token=${encodeURIComponent(resetToken.token)}&type=${type}`

    // Send email
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: generatePasswordResetEmail(resetUrl, userName || undefined),
    })

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
