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
  const { cart, removeFromCart, updateQuantity, clearCart, maxQuantityPerProduct } = useCart()

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
                const maxQty = item.stock != null && item.stock >= 0 ? Math.min(maxQuantityPerProduct, item.stock) : maxQuantityPerProduct
                const subtotal = item.price * item.quantity
                return (
                  <Card key={item.productId}>
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <Link href={getTenantLink(tenant, `/products/${item.productId}`)} className="shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded border border-border"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={getTenantLink(tenant, `/products/${item.productId}`)}>
                            <h3 className="text-xl font-bold mb-2 text-foreground hover:underline">{item.name}</h3>
                          </Link>
                          {item.description && (
                            <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-2xl font-bold">${Number(item.price).toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">Subtotal: ${subtotal.toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-0 border rounded-lg bg-muted/30">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="h-9 w-9 p-0 rounded-r-none"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-10 text-center font-semibold text-sm tabular-nums">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, Math.min(item.quantity + 1, maxQty))}
                                  className="h-9 w-9 p-0 rounded-l-none"
                                  disabled={item.quantity >= maxQty}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              {item.stock != null && item.quantity >= item.stock && (
                                <span className="text-xs text-amber-600">Max stock</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label="Remove from cart"
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

