'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tenant } from '@/lib/types'
import type { Banner } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'

interface BannerSectionProps {
  tenant: Tenant
  position: 'after-categories' | 'after-products'
  className?: string
}

export function BannerSection({ tenant, position, className }: BannerSectionProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/banners')
        if (!cancelled && res.ok) {
          const data = await res.json()
          setBanners(Array.isArray(data) ? data : [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [tenant.subdomain])

  if (loading) {
    return (
      <section className={className}>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="w-full h-64 md:h-80 rounded-lg" />
        </div>
      </section>
    )
  }

  const banner = banners.find((b) => b.position === position)
  if (!banner) return null

  const content = (
    <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden group">
      <img
        src={banner.image}
        alt={banner.title || 'Banner'}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {(banner.title || banner.description || banner.buttonText) && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            {banner.title && (
              <h3 className="text-2xl md:text-4xl font-bold mb-2">{banner.title}</h3>
            )}
            {banner.description && (
              <p className="text-lg mb-4">{banner.description}</p>
            )}
            {banner.buttonText && (
              <Button variant="secondary" size="lg">
                {banner.buttonText}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <section className={className}>
      <div className="container mx-auto px-4 py-8">
        {banner.link ? (
          <Link href={getTenantLink(tenant, banner.link)} className="block">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </section>
  )
}
