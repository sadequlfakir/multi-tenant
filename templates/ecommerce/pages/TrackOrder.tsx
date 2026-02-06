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
} from 'lucide-react'
import { EcommerceHeader } from '@/components/ecommerce-header'

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

const STATUS_STEPS: { key: TrackStatus; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: 'Order placed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

export default function TrackOrder({ tenant }: TrackOrderProps) {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrackOrderResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!orderNumber.trim() || !email.trim()) {
      setError('Please enter both order number and email.')
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        subdomain: tenant.subdomain,
        orderNumber: orderNumber.trim(),
        email: email.trim(),
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
    <div className="flex flex-col min-h-screen h-full bg-background">
      <EcommerceHeader tenant={tenant} />

      <section className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your order number and email to see the current status.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Look up order
              </CardTitle>
              <CardDescription>
                Use the order number and email from your confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="orderNumber">Order number *</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. ORD-1234567890-ABC123"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                    required
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                <ButtonWithLoader type="submit" loading={loading} loadingLabel="Searching…" className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Track order
                </ButtonWithLoader>
              </form>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Order {result.orderNumber}</CardTitle>
                <CardDescription>
                  Placed {new Date(result.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status timeline */}
                {result.status !== 'cancelled' && (
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-0" />
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= currentStepIndex
                      const Icon = step.icon
                      return (
                        <div key={step.key} className="flex flex-col items-center relative z-10 bg-background">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              done ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-xs mt-1 font-medium ${
                              done ? 'text-green-700' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {result.status === 'cancelled' && (
                  <div className="flex items-center gap-2 py-3 px-4 bg-red-50 text-red-700 rounded-lg">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">This order has been cancelled.</span>
                  </div>
                )}

                {/* Items */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Items</h4>
                  <ul className="space-y-2">
                    {result.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                      >
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        <span>${item.subtotal.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${result.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>${result.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${result.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2">
                    <span>Total</span>
                    <span>${result.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping address */}
                {result.shipping && (
                  <div className="flex gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Shipping address</p>
                      <p>
                        {result.shipping.address}, {result.shipping.city}
                        {result.shipping.state ? `, ${result.shipping.state}` : ''}{' '}
                        {result.shipping.zipCode}
                        {result.shipping.country ? `, ${result.shipping.country}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                <Link href={getTenantLink(tenant, '/')}>
                  <Button variant="outline" className="w-full">
                    Back to shop
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <footer className="bg-card border-t border-border text-card-foreground py-8 shrink-0">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
