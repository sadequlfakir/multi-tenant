'use client'

import { EcommerceHeader } from '@/components/ecommerce-header'
import { Tenant } from '@/lib/types'
import {
  HeroSection,
  FeaturedCategoriesSection,
  BannerSection,
  FeaturedProductsSection,
  CollectionsSection,
} from './sections'

interface EcommerceHomeProps {
  tenant: Tenant
}

export default function EcommerceHome({ tenant }: EcommerceHomeProps) {
  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      <HeroSection tenant={tenant} />

      <FeaturedCategoriesSection tenant={tenant} />

      <BannerSection tenant={tenant} position="after-categories" />

      <FeaturedProductsSection tenant={tenant} />

      <CollectionsSection tenant={tenant} />

      <BannerSection tenant={tenant} position="after-products" className="w-full py-8 bg-muted" />

      <footer className="bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
