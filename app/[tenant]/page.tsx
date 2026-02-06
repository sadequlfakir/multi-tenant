import { getTenantBySubdomain } from '@/lib/tenant-store'
import { getTemplate } from '@/templates'
import { cacheTenant } from '@/lib/tenant-cache'
import { notFound } from 'next/navigation'
import { TenantCartProvider } from '@/components/tenant-cart-provider'

// Ensure templates are registered
import '@/templates'

// Always fetch tenant from DB (Supabase) so deleted tenants don't show cached data
export const dynamic = 'force-dynamic'

export default async function TenantPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSubdomain } = await params
  const tenant = await getTenantBySubdomain(tenantSubdomain)

  if (!tenant) {
    notFound()
  }

  // Cache the tenant for future middleware requests
  cacheTenant(tenantSubdomain)

  const template = getTemplate(tenant.template)
  if (!template) {
    notFound()
  }

  return (
    <TenantCartProvider tenant={tenant}>
      {template.getHomeComponent(tenant)}
    </TenantCartProvider>
  )
}

