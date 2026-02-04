'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant, Order } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { CheckCircle2, Package, Home } from 'lucide-react'
import { EcommerceHeader } from '@/components/ecommerce-header'

interface OrderSuccessProps {
  tenant: Tenant
}

export default function OrderSuccess({ tenant }: OrderSuccessProps) {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}?subdomain=${tenant.subdomain}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [orderId, tenant.subdomain])

  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      {/* Success Content */}
      <section className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">Order Placed Successfully!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for your purchase. We've received your order and will process it shortly.
            </p>

            {order && (
              <div className="bg-muted rounded-lg p-6 mb-6 text-left">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number:</span>
                    <span className="font-semibold">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold text-lg">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold capitalize">{order.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-semibold">{order.items.length} item(s)</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href={getTenantLink(tenant, '/track-order')}>
                <Button variant="outline" size="lg">
                  Track this order
                </Button>
              </Link>
              <Link href={getTenantLink(tenant, '/products')}>
                <Button variant="outline" size="lg">
                  <Package className="w-5 h-5 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Link href={getTenantLink(tenant, '/')}>
                <Button size="lg">
                  <Home className="w-5 h-5 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
