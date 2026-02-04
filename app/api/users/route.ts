import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, User } from '@/lib/storage'
import { getAuthenticatedUser } from '@/lib/auth'
import { getTenantById } from '@/lib/tenant-store'

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user || !('role' in user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const users = await readUsers()
    return NextResponse.json(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      tenantId: u.tenantId,
      createdAt: u.createdAt,
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 })
  }
}

// Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, tenantId } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const users = await readUsers()
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // If tenantId is provided, verify it exists
    if (tenantId) {
      const tenant = await getTenantById(tenantId)
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      password, // In production, hash this
      tenantId: tenantId || '', // Can be empty, user will create tenant later
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    users.push(newUser)
    await writeUsers(users)

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      tenantId: newUser.tenantId,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
