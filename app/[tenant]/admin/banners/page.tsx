'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuthToken } from '@/lib/auth-client'
import { Image } from 'lucide-react'
import { useTenantAdmin } from '../use-tenant-admin'

export default function TenantAdminBannersPage() {
  const { tenant, loading: tenantLoading, adminBase } = useTenantAdmin()
  const [banners, setBanners] = useState<{ id: string; title?: string; image?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant || tenant.template !== 'ecommerce') return
    const token = getAuthToken()
    if (!token) return
    Promise.all([
      fetch(`/api/banners?subdomain=${tenant.subdomain}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/sliders?subdomain=${tenant.subdomain}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([b, s]) => setBanners(Array.isArray(b) ? b : Array.isArray(s) ? s : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tenant])

  if (tenantLoading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (tenant.template !== 'ecommerce') {
    return <p className="text-gray-500">Banners are only for e-commerce sites.</p>
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Banners & sliders</h1>
        <p className="text-sm text-gray-500 mt-1">Homepage banners and sliders</p>
      </div>
      {banners.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No banners yet</h3>
            <p className="text-gray-600">Add banners or sliders for your homepage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{b.title || 'Banner'}</CardTitle>
              </CardHeader>
              <CardContent>
                {b.image && (
                  <img
                    src={b.image}
                    alt={b.title || ''}
                    className="w-full h-32 object-cover rounded"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
