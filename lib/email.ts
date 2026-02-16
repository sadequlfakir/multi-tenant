/**
 * Email utility for sending emails (password reset, etc.)
 * Uses Resend for email delivery.
 */

import { Resend } from 'resend'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using Resend.
 * Requires RESEND_API_KEY environment variable and RESEND_FROM_EMAIL (or defaults to noreply@localhost).
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@localhost'

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set. Email not sent:', {
      to: options.to,
      subject: options.subject,
    })
    throw new Error('Email service is not configured. Please set RESEND_API_KEY in environment variables.')
  }

  try {
    const resend = new Resend(apiKey)
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    })

    if (result.error) {
      console.error('❌ Failed to send email:', result.error)
      throw new Error(`Failed to send email: ${result.error.message || 'Unknown error'}`)
    }

    console.log('✅ Email sent successfully:', {
      to: options.to,
      subject: options.subject,
      id: result.data?.id,
    })
  } catch (error) {
    console.error('❌ Email sending error:', error)
    throw error
  }
}

/**
 * Generate a password reset email HTML
 */
export function generatePasswordResetEmail(resetUrl: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>Hello${userName ? ` ${userName}` : ''},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </body>
    </html>
  `
}
