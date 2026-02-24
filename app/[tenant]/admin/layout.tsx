import { getTenantBySubdomain } from '@/lib/tenant-store'
import { notFound } from 'next/navigation'
import { TenantAdminLayoutClient } from './TenantAdminLayoutClient'

export const dynamic = 'force-dynamic'

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: subdomain } = await params
  const tenant = await getTenantBySubdomain(subdomain)

  if (!tenant) {
    notFound()
  }

  return (
    <TenantAdminLayoutClient tenant={tenant}>
      {children}
    </TenantAdminLayoutClient>
  )
}
