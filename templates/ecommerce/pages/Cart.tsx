'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { EcommerceHeader } from '@/components/ecommerce-header'

interface CartPageProps {
  tenant: Tenant
}

export default function CartPage({ tenant }: CartPageProps) {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()

  const getProduct = (productId: string) => {
    return tenant.config.products?.find(p => p.id === productId)
  }

  const total = cart.reduce((sum, item) => {
    const product = getProduct(item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      {/* Cart Content */}
      <section className="flex-1 container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href={getTenantLink(tenant, '/products')}>
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground">Shopping Cart</h1>
        </div>

        {cart.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some products to get started!</p>
              <Link href={getTenantLink(tenant, '/products')}>
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => {
                const product = getProduct(item.productId)
                if (!product) return null
                return (
                  <Card key={item.productId}>
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                          <p className="text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-2xl font-bold">${product.price}</p>
                                <p className="text-sm text-muted-foreground">Subtotal: ${(product.price * item.quantity).toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-2 border rounded-lg">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Link href={getTenantLink(tenant, '/checkout')}>
                    <Button className="w-full" size="lg" disabled={cart.length === 0}>
                      Proceed to Checkout
                    </Button>
                  </Link>
                  {cart.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={clearCart}
                    >
                      Clear Cart
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="shrink-0 bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

