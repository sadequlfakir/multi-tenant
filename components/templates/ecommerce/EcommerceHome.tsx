'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import { ShoppingCart, ArrowRight } from 'lucide-react'

interface EcommerceHomeProps {
  tenant: Tenant
}

export default function EcommerceHome({ tenant }: EcommerceHomeProps) {
  const featuredProducts = tenant.config.products?.slice(0, 3) || []

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{tenant.config.siteName}</h1>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4">Welcome to {tenant.config.siteName}</h2>
          <p className="text-xl mb-8">{tenant.config.siteDescription}</p>
          <Link href={`/${tenant.subdomain}/products`}>
            <Button size="lg" variant="secondary" className="text-lg">
              Shop Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
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
        <div className="text-center mt-8">
          <Link href={`/${tenant.subdomain}/products`}>
            <Button variant="outline" size="lg">
              View All Products
            </Button>
          </Link>
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

