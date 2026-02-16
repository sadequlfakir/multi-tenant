'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, MessageSquare, Plus } from 'lucide-react'
import type { ProductReview } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { useRouter } from 'next/navigation'

interface ProductReviewsProps {
  productId: string
  tenantSubdomain: string
  isCustomerLoggedIn: boolean
}

export function ProductReviews({ productId, tenantSubdomain, isCustomerLoggedIn }: ProductReviewsProps) {
  const router = useRouter()
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reviewableOrders, setReviewableOrders] = useState<any[]>([])
  const [reviewForm, setReviewForm] = useState({
    orderId: '',
    rating: 5,
    title: '',
    comment: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadReviews()
    if (isCustomerLoggedIn) {
      loadReviewableOrders()
    }
  }, [productId, tenantSubdomain, isCustomerLoggedIn])

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews?subdomain=${encodeURIComponent(tenantSubdomain)}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        setAverageRating(data.averageRating || 0)
        setTotalReviews(data.totalReviews || 0)
      }
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviewableOrders = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const response = await fetch(`/api/customer/reviewable-orders?productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setReviewableOrders(data || [])
      }
    } catch (error) {
      console.error('Failed to load reviewable orders:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.orderId || !reviewForm.rating) {
      setError('Please select an order and provide a rating')
      return
    }

    const token = localStorage.getItem('customerToken')
    if (!token) {
      router.push(`/${tenantSubdomain}/customer/login`)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/products/${productId}/reviews?subdomain=${encodeURIComponent(tenantSubdomain)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewForm),
      })

      if (response.ok) {
        setShowReviewDialog(false)
        setReviewForm({
          orderId: '',
          rating: 5,
          title: '',
          comment: '',
        })
        loadReviews()
        loadReviewableOrders()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      setError('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Reviews ({totalReviews})
            </CardTitle>
            {averageRating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {renderStars(Math.round(averageRating), 'md')}
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} out of 5
                </span>
              </div>
            )}
          </div>
          {isCustomerLoggedIn && reviewableOrders.length > 0 && (
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Write Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                  <DialogDescription>
                    Share your experience with this product
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="order-select">Select Order</Label>
                    <Select
                      value={reviewForm.orderId}
                      onValueChange={(value) => setReviewForm({ ...reviewForm, orderId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an order" />
                      </SelectTrigger>
                      <SelectContent>
                        {reviewableOrders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            Order #{order.orderNumber} - {new Date(order.createdAt).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Rating</Label>
                    <div className="flex gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              rating <= reviewForm.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="review-title">Title (Optional)</Label>
                    <Input
                      id="review-title"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      placeholder="Brief summary of your review"
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-comment">Comment</Label>
                    <Textarea
                      id="review-comment"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your thoughts about this product..."
                      rows={4}
                    />
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                      Cancel
                    </Button>
                    <ButtonWithLoader onClick={handleSubmitReview} loading={submitting}>
                      Submit Review
                    </ButtonWithLoader>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No reviews yet</p>
            {isCustomerLoggedIn && reviewableOrders.length === 0 && (
              <p className="text-sm mt-2">Purchase and receive this product to leave a review</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-6 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{review.customerName || 'Anonymous'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {renderStars(review.rating, 'sm')}
                </div>
                {review.title && (
                  <h5 className="font-medium mb-2">{review.title}</h5>
                )}
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
