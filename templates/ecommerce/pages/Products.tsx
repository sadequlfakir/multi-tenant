'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { EcommerceHeader } from '@/components/ecommerce-header'

interface EcommerceProductsProps {
    tenant: Tenant
}

export default function EcommerceProducts({ tenant }: EcommerceProductsProps) {
    const products = (tenant.config.products || []).filter(p => p.status === 'active')
    const { addToCart } = useCart()

    return (
        <div className="min-h-screen bg-background">
            <EcommerceHeader tenant={tenant} />

            {/* Products Grid */}
            <section className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8 text-foreground">All Products</h1>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-square bg-muted relative">
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
                                    <span className="text-xs text-muted-foreground mt-2">Category: {product.category}</span>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-2xl font-bold">${product.price}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                addToCart(product.id, 1)
                                                // Show feedback
                                                const button = e.currentTarget as HTMLElement
                                                const originalText = button.textContent
                                                button.textContent = 'Added!'
                                                setTimeout(() => {
                                                  button.textContent = originalText
                                                }, 1500)
                                            }}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-1" />
                                            Add to Cart
                                        </Button>
                                        <Link href={getTenantLink(tenant, `/products/${product.id}`)}>
                                            <Button size="sm">Details</Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {products.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-lg">No products available yet.</p>
                    </div>
                )}
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

