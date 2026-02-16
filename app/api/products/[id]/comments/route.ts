import { NextRequest, NextResponse } from 'next/server'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { readProductComments, writeProductComments, readCustomers } from '@/lib/storage'
import { getAuthenticatedCustomer } from '@/lib/auth'
import type { ProductComment } from '@/lib/types'

// GET - Get all comments for a product (with nested replies)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const subdomain = getTenantSubdomainFromRequest(request)

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required' },
        { status: 400 }
      )
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant || tenant.template !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Tenant not found or not an e-commerce site' },
        { status: 404 }
      )
    }

    const comments = await readProductComments()
    const productComments = comments.filter(
      c => c.productId === productId && c.tenantId === tenant.id
    )

    // Populate customer names
    const customers = await readCustomers()
    const commentsWithCustomerInfo = productComments.map(comment => {
      const customer = customers.find(c => c.id === comment.customerId)
      return {
        ...comment,
        customerName: customer?.name || 'Anonymous',
        customerEmail: customer?.email || '',
      }
    })

    // Organize comments into parent-child structure
    const topLevelComments = commentsWithCustomerInfo.filter(c => !c.parentId)
    const repliesMap = new Map<string, ProductComment[]>()
    
    commentsWithCustomerInfo.forEach(comment => {
      if (comment.parentId) {
        if (!repliesMap.has(comment.parentId)) {
          repliesMap.set(comment.parentId, [])
        }
        repliesMap.get(comment.parentId)!.push(comment)
      }
    })

    // Attach replies to parent comments
    const commentsWithReplies = topLevelComments.map(comment => ({
      ...comment,
      replies: repliesMap.get(comment.id) || [],
    }))

    return NextResponse.json({
      comments: commentsWithReplies,
      totalComments: commentsWithCustomerInfo.length,
    })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST - Create a new comment (any logged-in customer can comment)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to comment.' },
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

    const subdomain = getTenantSubdomainFromRequest(request)
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required' },
        { status: 400 }
      )
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant || tenant.template !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Tenant not found or not an e-commerce site' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { comment, parentId } = body

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      )
    }

    // If parentId is provided, verify it exists and belongs to the same product
    if (parentId) {
      const comments = await readProductComments()
      const parentComment = comments.find(
        c => c.id === parentId && c.productId === productId && c.tenantId === tenant.id
      )
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create comment
    const newComment: ProductComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      productId,
      tenantId: tenant.id,
      customerId: result.customer.id,
      comment: comment.trim(),
      parentId: parentId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const comments = await readProductComments()
    comments.push(newComment)
    await writeProductComments(comments)

    // Populate customer info
    const customers = await readCustomers()
    const customer = customers.find(c => c.id === result.customer.id)
    const commentWithCustomer = {
      ...newComment,
      customerName: customer?.name || 'Anonymous',
      customerEmail: customer?.email || '',
      replies: [],
    }

    return NextResponse.json(commentWithCustomer, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
