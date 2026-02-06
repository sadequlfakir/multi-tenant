'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tenant } from '@/lib/types'
import type { Slider as SliderItem } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ArrowRight } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface HeroSectionProps {
  tenant: Tenant
}

export function HeroSection({ tenant }: HeroSectionProps) {
  const [sliders, setSliders] = useState<SliderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/sliders')
        if (!cancelled && res.ok) {
          const data = await res.json()
          setSliders(Array.isArray(data) ? data : [])
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
      <section className="relative w-full min-h-[420px] h-[55vh] md:min-h-[520px] md:h-[65vh] lg:h-[75vh] overflow-hidden bg-muted">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 px-4 max-w-2xl">
            <Skeleton className="h-12 w-3/4 mx-auto rounded-lg" />
            <Skeleton className="h-6 w-full rounded" />
            <Skeleton className="h-6 w-2/3 mx-auto rounded" />
            <Skeleton className="h-12 w-40 mx-auto rounded-full" />
          </div>
        </div>
      </section>
    )
  }

  if (sliders.length > 0) {
    return (
      <Slider
        sliders={sliders}
        tenant={tenant}
        autoPlay={tenant.config.sliderConfig?.autoPlay !== false}
        interval={tenant.config.sliderConfig?.interval || 5000}
      />
    )
  }

  return (
    <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground min-h-[50vh] flex items-center py-24">
      <div className="container mx-auto px-4 text-center w-full">
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
  )
}
