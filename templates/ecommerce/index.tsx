'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { EcommerceHeader } from '@/components/ecommerce-header'
import { useCart } from '@/lib/cart-context'

interface EcommerceHomeProps {
  tenant: Tenant
}

export default function EcommerceHome({ tenant }: EcommerceHomeProps) {
  // Filter featured products
  const featuredProducts = tenant.config.products?.filter(p => p.featured && p.status === 'active') || []
  
  // Filter featured categories
  const featuredCategories = tenant.config.categories?.filter(c => c.featured && c.status === 'active')
    .sort((a, b) => (a.order || 0) - (b.order || 0)) || []
  
  // Get active sliders
  const sliders = tenant.config.sliders?.filter(s => s.status === 'active') || []
  
  // Get active banners
  const banners = tenant.config.banners?.filter(b => b.status === 'active') || []
  const bannerAfterCategories = banners.find(b => b.position === 'after-categories')
  const bannerAfterProducts = banners.find(b => b.position === 'after-products')

  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      {/* Slider Section */}
      {sliders.length > 0 ? (
        <Slider 
          sliders={sliders} 
          tenant={tenant}
          autoPlay={tenant.config.sliderConfig?.autoPlay !== false}
          interval={tenant.config.sliderConfig?.interval || 5000}
        />
      ) : (
        <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-5xl font-bold mb-4">Welcome to {tenant.config.siteName}</h2>
            <p className="text-xl mb-8">{tenant.config.siteDescription}</p>
            <Link href={getTenantLink(tenant, '/products')}>
              <Button size="lg" variant="secondary" className="text-lg bg-white/20 hover:bg-white/30 text-primary-foreground border-0">
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Featured Categories */}
      {featuredCategories.length > 0 && (
        <section className="container mx-auto px-4 py-16 bg-muted">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Categories</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredCategories.map((category) => (
              <Link key={category.id} href={getTenantLink(tenant, `/products?category=${category.slug}`)}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="aspect-square bg-muted relative">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <span className="text-4xl font-bold text-primary">{category.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                      Featured
                    </span>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    {category.description && (
                      <CardDescription className="line-clamp-2">{category.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Banner After Categories */}
      {bannerAfterCategories && (
        <section className="w-full py-8">
          <div className="container mx-auto px-4">
            {bannerAfterCategories.link ? (
              <Link href={getTenantLink(tenant, bannerAfterCategories.link)} className="block">
                <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden group">
                  <img
                    src={bannerAfterCategories.image}
                    alt={bannerAfterCategories.title || 'Banner'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {(bannerAfterCategories.title || bannerAfterCategories.description || bannerAfterCategories.buttonText) && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="text-center text-white px-4">
                        {bannerAfterCategories.title && (
                          <h3 className="text-2xl md:text-4xl font-bold mb-2">{bannerAfterCategories.title}</h3>
                        )}
                        {bannerAfterCategories.description && (
                          <p className="text-lg mb-4">{bannerAfterCategories.description}</p>
                        )}
                        {bannerAfterCategories.buttonText && (
                          <Button variant="secondary" size="lg">
                            {bannerAfterCategories.buttonText}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
                <img
                  src={bannerAfterCategories.image}
                  alt={bannerAfterCategories.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
                {(bannerAfterCategories.title || bannerAfterCategories.description) && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      {bannerAfterCategories.title && (
                        <h3 className="text-2xl md:text-4xl font-bold mb-2">{bannerAfterCategories.title}</h3>
                      )}
                      {bannerAfterCategories.description && (
                        <p className="text-lg">{bannerAfterCategories.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Products</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                    Featured
                  </span>
                </div>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${product.price}</span>
                    <Link href={getTenantLink(tenant, `/products/${product.id}`)}>
                      <Button>View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href={getTenantLink(tenant, '/products')}>
              <Button variant="outline" size="lg" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                View All Products
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Banner After Products */}
      {bannerAfterProducts && (
        <section className="w-full py-8 bg-muted">
          <div className="container mx-auto px-4">
            {bannerAfterProducts.link ? (
              <Link href={getTenantLink(tenant, bannerAfterProducts.link)} className="block">
                <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden group">
                  <img
                    src={bannerAfterProducts.image}
                    alt={bannerAfterProducts.title || 'Banner'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {(bannerAfterProducts.title || bannerAfterProducts.description || bannerAfterProducts.buttonText) && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="text-center text-white px-4">
                        {bannerAfterProducts.title && (
                          <h3 className="text-2xl md:text-4xl font-bold mb-2">{bannerAfterProducts.title}</h3>
                        )}
                        {bannerAfterProducts.description && (
                          <p className="text-lg mb-4">{bannerAfterProducts.description}</p>
                        )}
                        {bannerAfterProducts.buttonText && (
                          <Button variant="secondary" size="lg">
                            {bannerAfterProducts.buttonText}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
                <img
                  src={bannerAfterProducts.image}
                  alt={bannerAfterProducts.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
                {(bannerAfterProducts.title || bannerAfterProducts.description) && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      {bannerAfterProducts.title && (
                        <h3 className="text-2xl md:text-4xl font-bold mb-2">{bannerAfterProducts.title}</h3>
                      )}
                      {bannerAfterProducts.description && (
                        <p className="text-lg">{bannerAfterProducts.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

