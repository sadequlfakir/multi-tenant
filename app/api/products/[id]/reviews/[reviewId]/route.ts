import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readProductReviews, writeProductReviews } from '@/lib/storage'
import type { ProductReview } from '@/lib/types'

// PUT - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params
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
    const { rating, title, comment } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating (1-5) is required' },
        { status: 400 }
      )
    }

    const reviews = await readProductReviews()
    const reviewIndex = reviews.findIndex(
      r => r.id === reviewId && r.customerId === result.customer.id
    )

    if (reviewIndex === -1) {
      return NextResponse.json(
        { error: 'Review not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Update review
    reviews[reviewIndex] = {
      ...reviews[reviewIndex],
      rating,
      title: title || undefined,
      comment: comment || undefined,
      updatedAt: new Date().toISOString(),
    }

    await writeProductReviews(reviews)

    return NextResponse.json(reviews[reviewIndex])
  } catch (error) {
    console.error('Failed to update review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { reviewId } = await params
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

    const reviews = await readProductReviews()
    const reviewIndex = reviews.findIndex(
      r => r.id === reviewId && r.customerId === result.customer.id
    )

    if (reviewIndex === -1) {
      return NextResponse.json(
        { error: 'Review not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    reviews.splice(reviewIndex, 1)
    await writeProductReviews(reviews)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
