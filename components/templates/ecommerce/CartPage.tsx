'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import { ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react'

interface CartPageProps {
  tenant: Tenant
}

export default function CartPage({ tenant }: CartPageProps) {
  // In a real app, this would come from state/API
  const cartItems: Array<{ productId: string; quantity: number }> = []

  const getProduct = (productId: string) => {
    return tenant.config.products?.find(p => p.id === productId)
  }

  const total = cartItems.reduce((sum, item) => {
    const product = getProduct(item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${tenant.subdomain}`}>
            <h1 className="text-2xl font-bold">{tenant.config.siteName}</h1>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href={`/${tenant.subdomain}`} className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href={`/${tenant.subdomain}/products`} className="text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link href={`/${tenant.subdomain}/cart`}>
              <Button variant="outline" size="sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Cart Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/${tenant.subdomain}/products`}>
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products to get started!</p>
              <Link href={`/${tenant.subdomain}/products`}>
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cartItems.map((item) => {
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
                          <p className="text-gray-600 mb-4">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold">${product.price}</p>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                            <Button variant="ghost" size="sm">
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
                  <Link href={`/${tenant.subdomain}/checkout`}>
                    <Button className="w-full" size="lg">
                      Proceed to Checkout
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

