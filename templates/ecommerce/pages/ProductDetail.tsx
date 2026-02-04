'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tenant, Product } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { EcommerceHeader } from '@/components/ecommerce-header'

interface ProductDetailProps {
  tenant: Tenant
  productId: string
}

export default function ProductDetail({ tenant, productId }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart: addToCartContext } = useCart()
  
  const product = tenant.config.products?.find(p => p.id === productId)

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Product not found</h1>
          <Link href={getTenantLink(tenant, '/products')} className="text-primary hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const addToCart = () => {
    if (!product) return
    addToCartContext(product.id, quantity)
    // Show success message
    const button = document.querySelector('[data-add-to-cart]') as HTMLElement
    if (button) {
      const originalText = button.textContent
      button.textContent = 'Added to Cart!'
      setTimeout(() => {
        button.textContent = originalText
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      {/* Product Detail */}
      <section className="container mx-auto px-4 py-12">
        <Link href={getTenantLink(tenant, '/products')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">{product.name}</h1>
            <p className="text-3xl font-bold text-primary mb-6">${product.price}</p>
            <p className="text-muted-foreground mb-6 text-lg">{product.description}</p>
            
            {product.category && (
              <p className="text-sm text-muted-foreground mb-6">Category: {product.category}</p>
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
                <Button className="w-full" size="lg" onClick={addToCart} data-add-to-cart>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>

            {/* Comments section – only shown when Allow Comments is enabled in Settings */}
            {tenant.config.settings?.allowComments !== false && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Comments</h3>
                  <p className="text-muted-foreground text-sm">
                    Comments are enabled for this product. A full comment system (post, moderate, reply) can be added later with an API and storage.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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

