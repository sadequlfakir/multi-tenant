'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import {
  Package,
  Search,
  CheckCircle2,
  Truck,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Receipt,
} from 'lucide-react'
import { EcommerceHeader } from '@/components/ecommerce-header'
import { cn } from '@/lib/utils'

type TrackStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface TrackOrderResult {
  orderNumber: string
  status: TrackStatus
  createdAt: string
  updatedAt: string
  total: number
  subtotal: number
  shippingCost: number
  tax: number
  items: { productName: string; quantity: number; subtotal: number }[]
  shipping?: {
    address: string
    city: string
    state?: string
    zipCode: string
    country?: string
  }
}

interface TrackOrderProps {
  tenant: Tenant
}

const STATUS_STEPS: { key: TrackStatus; label: string; icon: typeof Package }[] = [
  { key: 'pending', label: 'Order placed', icon: Receipt },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

function StatusBadge({ status }: { status: TrackStatus }) {
  const styles: Record<TrackStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium',
        styles[status]
      )}
    >
      {label}
    </span>
  )
}

export default function TrackOrder({ tenant }: TrackOrderProps) {
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrackOrderResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!orderNumber.trim()) {
      setError('Please enter your order number.')
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        subdomain: tenant.subdomain,
        orderNumber: orderNumber.trim(),
      })
      const res = await fetch(`/api/track-order?${params}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Order not found.')
        return
      }
      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentStepIndex = result
    ? Math.max(
        0,
        STATUS_STEPS.findIndex((s) => s.key === result.status)
      )
    : -1

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      <section className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-xl mx-auto">
          {/* Lookup */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Track your order</h1>
            <p className="text-muted-foreground mt-1.5 text-sm md:text-base">
              Enter the order number from your confirmation.
            </p>
          </div>

          <Card className="border-border shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber" className="text-foreground font-medium">
                    Order number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="orderNumber"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. ORD-1234567890-ABC123"
                      className="flex-1 h-11"
                      required
                      disabled={loading}
                    />
                    <ButtonWithLoader
                      type="submit"
                      loading={loading}
                      loadingLabel="Looking up…"
                      className="h-11 px-6 shrink-0"
                    >
                      <Search className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Track</span>
                    </ButtonWithLoader>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <div className="mt-8 space-y-6">
              {/* Order header */}
              <Card className="border-border shadow-sm overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Order #{result.orderNumber}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Placed {new Date(result.createdAt).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </CardDescription>
                    </div>
                    <StatusBadge status={result.status} />
                  </div>
                </CardHeader>
              </Card>

              {/* Status timeline */}
              {result.status !== 'cancelled' && (
                <Card className="border-border shadow-sm overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Order status</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="relative">
                      <div className="absolute left-4 top-6 bottom-6 w-px bg-border" />
                      <ul className="space-y-0">
                        {STATUS_STEPS.map((step, i) => {
                          const done = i <= currentStepIndex
                          const current = i === currentStepIndex
                          const Icon = step.icon
                          return (
                            <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                              <div
                                className={cn(
                                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                  done
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-background',
                                  current && 'ring-2 ring-primary/20'
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 pt-0.5">
                                <p
                                  className={cn(
                                    'text-sm font-medium',
                                    done ? 'text-foreground' : 'text-muted-foreground'
                                  )}
                                >
                                  {step.label}
                                </p>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.status === 'cancelled' && (
                <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="font-medium text-destructive">This order has been cancelled.</p>
                  </CardContent>
                </Card>
              )}

              {/* Items & totals */}
              <Card className="border-border shadow-sm overflow-hidden">
                <CardHeader className="py-4">
                  <CardTitle className="text-base font-medium">Order details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-0">
                  <div className="divide-y divide-border">
                    {result.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-4 first:pt-0"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="font-medium text-foreground text-sm truncate">
                            {item.productName}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-foreground shrink-0">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${result.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Shipping</span>
                      <span>${result.shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax</span>
                      <span>${result.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-foreground pt-2">
                      <span>Total</span>
                      <span>${result.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping */}
              {result.shipping && (
                <Card className="border-border shadow-sm overflow-hidden">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Shipping address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.shipping.address}
                      <br />
                      {result.shipping.city}
                      {result.shipping.state ? `, ${result.shipping.state}` : ''}{' '}
                      {result.shipping.zipCode}
                      {result.shipping.country && (
                        <>
                          <br />
                          {result.shipping.country}
                        </>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Link href={getTenantLink(tenant, '/')} className="block">
                <Button variant="outline" className="w-full h-11" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to shop
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border bg-card text-muted-foreground py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
