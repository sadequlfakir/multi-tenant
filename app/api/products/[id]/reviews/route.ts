import { NextRequest, NextResponse } from 'next/server'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { readProductReviews, writeProductReviews, readOrders, readCustomers } from '@/lib/storage'
import { getAuthenticatedCustomer } from '@/lib/auth'
import type { ProductReview, Order } from '@/lib/types'

// GET - Get all reviews for a product
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

    const reviews = await readProductReviews()
    const productReviews = reviews.filter(
      r => r.productId === productId && r.tenantId === tenant.id
    )

    // Populate customer names
    const customers = await readCustomers()
    const reviewsWithCustomerInfo = productReviews.map(review => {
      const customer = customers.find(c => c.id === review.customerId)
      return {
        ...review,
        customerName: customer?.name || 'Anonymous',
        customerEmail: customer?.email || '',
      }
    })

    // Calculate average rating
    const avgRating = reviewsWithCustomerInfo.length > 0
      ? reviewsWithCustomerInfo.reduce((sum, r) => sum + r.rating, 0) / reviewsWithCustomerInfo.length
      : 0

    return NextResponse.json({
      reviews: reviewsWithCustomerInfo,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviewsWithCustomerInfo.length,
    })
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST - Create a new review (only if customer has delivered order)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
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
    const { orderId, rating, title, comment } = body

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Order ID and rating (1-5) are required' },
        { status: 400 }
      )
    }

    // Verify the order exists, belongs to the customer, contains the product, and is delivered
    const orders = await readOrders()
    const order = orders.find(
      o => o.id === orderId &&
      o.tenantId === tenant.id &&
      o.customer.email.toLowerCase() === result.customer.email.toLowerCase() &&
      o.status === 'delivered'
    )

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found, not delivered, or does not belong to you' },
        { status: 404 }
      )
    }

    // Verify the product is in the order
    const productInOrder = order.items.some(item => item.productId === productId)
    if (!productInOrder) {
      return NextResponse.json(
        { error: 'This product is not in the specified order' },
        { status: 400 }
      )
    }

    // Check if review already exists for this order/product combination
    const reviews = await readProductReviews()
    const existingReview = reviews.find(
      r => r.customerId === result.customer.id &&
      r.productId === productId &&
      r.orderId === orderId &&
      r.tenantId === tenant.id
    )

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product for this order' },
        { status: 400 }
      )
    }

    // Create review
    const newReview: ProductReview = {
      id: `review-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      productId,
      tenantId: tenant.id,
      customerId: result.customer.id,
      orderId,
      rating,
      title: title || undefined,
      comment: comment || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    reviews.push(newReview)
    await writeProductReviews(reviews)

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error('Failed to create review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
