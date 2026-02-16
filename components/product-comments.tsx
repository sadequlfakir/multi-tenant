'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { MessageSquare, Send, Edit, Trash2, Reply } from 'lucide-react'
import type { ProductComment } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface ProductCommentsProps {
  productId: string
  tenantSubdomain: string
  isCustomerLoggedIn: boolean
  currentCustomerId?: string
}

export function ProductComments({ productId, tenantSubdomain, isCustomerLoggedIn, currentCustomerId }: ProductCommentsProps) {
  const router = useRouter()
  const [comments, setComments] = useState<ProductComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | undefined>(currentCustomerId)
  const [commentForm, setCommentForm] = useState({
    text: '',
    parentId: null as string | null,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadComments()
    if (isCustomerLoggedIn && !customerId) {
      loadCustomerId()
    }
  }, [productId, tenantSubdomain, isCustomerLoggedIn])

  const loadCustomerId = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const response = await fetch('/api/customer/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCustomerId(data.id)
      }
    } catch (error) {
      console.error('Failed to load customer ID:', error)
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/comments?subdomain=${encodeURIComponent(tenantSubdomain)}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentForm.text.trim()) {
      setError('Please enter a comment')
      return
    }

    if (!isCustomerLoggedIn) {
      router.push(`/${tenantSubdomain}/customer/login`)
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
      const url = `/api/products/${productId}/comments?subdomain=${encodeURIComponent(tenantSubdomain)}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: commentForm.text,
          parentId: commentForm.parentId,
        }),
      })

      if (response.ok) {
        setCommentForm({ text: '', parentId: null })
        setReplyingToId(null)
        loadComments()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit comment')
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      setError('Failed to submit comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateComment = async (commentId: string, newText: string) => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const response = await fetch(`/api/products/${productId}/comments/${commentId}?subdomain=${encodeURIComponent(tenantSubdomain)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: newText }),
      })

      if (response.ok) {
        setEditingId(null)
        loadComments()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update comment')
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const response = await fetch(`/api/products/${productId}/comments/${commentId}?subdomain=${encodeURIComponent(tenantSubdomain)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        loadComments()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment')
    }
  }

  const renderComment = (comment: ProductComment, level: number = 0) => {
    const isOwnComment = customerId && comment.customerId === customerId

    return (
      <div key={comment.id} className={level > 0 ? 'ml-8 mt-4 border-l-2 border-muted pl-4' : 'mb-6 pb-6 border-b last:border-0'}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-sm">{comment.customerName || 'Anonymous'}</h4>
            <p className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}
            </p>
          </div>
          {isCustomerLoggedIn && (
            <div className="flex gap-2">
              {level === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingToId(comment.id)
                    setCommentForm({ text: '', parentId: comment.id })
                  }}
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}
              {isOwnComment && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(comment.id)
                      setCommentForm({ text: comment.comment, parentId: null })
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        
        {editingId === comment.id ? (
          <div className="space-y-2">
            <Textarea
              value={commentForm.text}
              onChange={(e) => setCommentForm({ ...commentForm, text: e.target.value })}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                handleUpdateComment(comment.id, commentForm.text)
                setEditingId(null)
              }}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setEditingId(null)
                setCommentForm({ text: '', parentId: null })
              }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{comment.comment}</p>
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map(reply => renderComment(reply, level + 1))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments & Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments & Questions ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment Form */}
        {isCustomerLoggedIn ? (
          <div className="mb-6 space-y-4">
            {replyingToId && (
              <div className="text-sm text-muted-foreground">
                Replying to: {comments.find(c => c.id === replyingToId)?.customerName || 'comment'}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingToId(null)
                    setCommentForm({ text: '', parentId: null })
                  }}
                  className="ml-2"
                >
                  Cancel
                </Button>
              </div>
            )}
            <Textarea
              placeholder={replyingToId ? "Write your reply..." : "Ask a question or share your thoughts about this product..."}
              value={commentForm.text}
              onChange={(e) => setCommentForm({ ...commentForm, text: e.target.value })}
              rows={4}
            />
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
            <ButtonWithLoader onClick={handleSubmitComment} loading={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {replyingToId ? 'Post Reply' : 'Post Comment'}
            </ButtonWithLoader>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Please log in to ask questions or leave comments
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${tenantSubdomain}/customer/login`)}
            >
              Login
            </Button>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm mt-2">Be the first to ask a question or share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
