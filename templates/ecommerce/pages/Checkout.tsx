'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tenant, OrderItem } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { EcommerceHeader } from '@/components/ecommerce-header'

interface CheckoutPageProps {
  tenant: Tenant
}

export default function CheckoutPage({ tenant }: CheckoutPageProps) {
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    cardNumber: '',
    expiry: '',
    cvv: '',
  })

  const getProduct = (productId: string) => {
    return tenant.config.products?.find(p => p.id === productId)
  }

  const orderItems: OrderItem[] = cart.map(item => {
    const product = getProduct(item.productId)
    if (!product) {
      return {
        productId: item.productId,
        productName: 'Unknown Product',
        quantity: item.quantity,
        price: 0,
        subtotal: 0,
      }
    }
    return {
      productId: item.productId,
      productName: product.name,
      productImage: product.image,
      quantity: item.quantity,
      price: product.price,
      subtotal: product.price * item.quantity,
    }
  })

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const shippingCost = 0 // Can be calculated based on address
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + shippingCost + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert('Your cart is empty')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subdomain: tenant.subdomain,
          items: orderItems,
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
          },
          shipping: {
            address: formData.address,
            city: formData.city,
            state: formData.state || undefined,
            zipCode: formData.zipCode,
            country: formData.country || 'US',
            shippingCost,
          },
          payment: {
            method: 'card',
            cardLast4: formData.cardNumber.slice(-4),
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const order = await response.json()
      clearCart()
      router.push(getTenantLink(tenant, `/order-success?orderId=${order.id}`))
    } catch (error: any) {
      alert(error.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <EcommerceHeader tenant={tenant} />
        <section className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some products to checkout</p>
              <Link href={getTenantLink(tenant, '/products')}>
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      {/* Checkout Content */}
      <section className="container mx-auto px-4 py-12">
        <Link href={getTenantLink(tenant, '/cart')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input 
                      id="address" 
                      placeholder="123 Main St"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input 
                        id="city" 
                        placeholder="New York"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input 
                        id="zip" 
                        placeholder="10001"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      placeholder="NY"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="card">Card Number *</Label>
                  <Input 
                    id="card" 
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value.replace(/\s/g, '') })}
                    maxLength={16}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date *</Label>
                    <Input 
                      id="expiry" 
                      placeholder="MM/YY"
                      value={formData.expiry}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input 
                      id="cvv" 
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.productName} x {item.quantity}</span>
                        <span>${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <ButtonWithLoader 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    loading={loading}
                    loadingLabel="Processing..."
                  >
                    Place Order
                  </ButtonWithLoader>
                  <p className="text-xs text-muted-foreground text-center">
                    This is a demo checkout page. No actual payment will be processed.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
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

