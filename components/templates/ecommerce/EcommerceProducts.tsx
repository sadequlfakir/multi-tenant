'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import { ShoppingCart } from 'lucide-react'

interface EcommerceProductsProps {
  tenant: Tenant
}

export default function EcommerceProducts({ tenant }: EcommerceProductsProps) {
  const products = tenant.config.products || []

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
            <Link href={`/${tenant.subdomain}/products`} className="text-gray-900 font-semibold">
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

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">All Products</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-200 relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
                {product.category && (
                  <span className="text-xs text-gray-500 mt-2">Category: {product.category}</span>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${product.price}</span>
                  <Link href={`/${tenant.subdomain}/products/${product.id}`}>
                    <Button>View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products available yet.</p>
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

