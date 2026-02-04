'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tenant, Product } from '@/lib/types'
import { ShoppingCart, ArrowLeft } from 'lucide-react'

interface ProductDetailProps {
  tenant: Tenant
  product: Product
}

export default function ProductDetail({ tenant, product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)

  const addToCart = () => {
    // In a real app, this would call an API
    alert(`Added ${quantity} x ${product.name} to cart!`)
  }

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

      {/* Product Detail */}
      <section className="container mx-auto px-4 py-12">
        <Link href={`/${tenant.subdomain}/products`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-blue-600 mb-6">${product.price}</p>
            <p className="text-gray-600 mb-6 text-lg">{product.description}</p>
            
            {product.category && (
              <p className="text-sm text-gray-500 mb-6">Category: {product.category}</p>
            )}

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="font-semibold">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={addToCart}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
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

