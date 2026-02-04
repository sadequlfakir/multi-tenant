import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers } from '@/lib/storage'
import { getAuthenticatedUser } from '@/lib/auth'

// Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await getAuthenticatedUser(token)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can only update their own account
    if (currentUser.id !== id && !('role' in currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const users = await readUsers()
    const userIndex = users.findIndex(u => u.id === id)

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user (don't allow password update here, use separate endpoint)
    if (body.tenantId !== undefined) {
      users[userIndex].tenantId = body.tenantId
    }
    if (body.name !== undefined) {
      users[userIndex].name = body.name
    }
    users[userIndex].updatedAt = new Date().toISOString()

    await writeUsers(users)

    return NextResponse.json({
      id: users[userIndex].id,
      email: users[userIndex].email,
      name: users[userIndex].name,
      tenantId: users[userIndex].tenantId,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
