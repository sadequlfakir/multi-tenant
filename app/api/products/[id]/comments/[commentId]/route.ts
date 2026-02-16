import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readProductComments, writeProductComments } from '@/lib/storage'
import type { ProductComment } from '@/lib/types'

// PUT - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params
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
    const { comment } = body

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      )
    }

    const comments = await readProductComments()
    const commentIndex = comments.findIndex(
      c => c.id === commentId && c.customerId === result.customer.id
    )

    if (commentIndex === -1) {
      return NextResponse.json(
        { error: 'Comment not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Update comment
    comments[commentIndex] = {
      ...comments[commentIndex],
      comment: comment.trim(),
      updatedAt: new Date().toISOString(),
    }

    await writeProductComments(comments)

    return NextResponse.json(comments[commentIndex])
  } catch (error) {
    console.error('Failed to update comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params
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

    const comments = await readProductComments()
    const commentIndex = comments.findIndex(
      c => c.id === commentId && c.customerId === result.customer.id
    )

    if (commentIndex === -1) {
      return NextResponse.json(
        { error: 'Comment not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Check if comment has replies
    const hasReplies = comments.some(c => c.parentId === commentId)
    if (hasReplies) {
      return NextResponse.json(
        { error: 'Cannot delete comment that has replies' },
        { status: 400 }
      )
    }

    comments.splice(commentIndex, 1)
    await writeProductComments(comments)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
