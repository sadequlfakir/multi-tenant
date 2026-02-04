import type { Metadata } from 'next'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { cacheTenant } from '@/lib/tenant-cache'
import { notFound } from 'next/navigation'
import { hexToHsl, getPrimaryForegroundHsl } from '@/lib/theme-utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>
}): Promise<Metadata> {
  const { tenant: tenantSubdomain } = await params
  const tenant = await getTenantBySubdomain(tenantSubdomain)
  if (!tenant) return {}
  const title = tenant.config.seoTitle || tenant.config.siteName
  const description =
    tenant.config.seoDescription || tenant.config.siteDescription || undefined
  const keywords = tenant.config.seoKeywords?.length
    ? tenant.config.seoKeywords.join(', ')
    : undefined
  return {
    title: { default: title, template: `%s | ${tenant.config.siteName}` },
    description: description?.slice(0, 160),
    keywords: keywords ?? undefined,
    icons: tenant.config.favicon
      ? [{ rel: 'icon', url: tenant.config.favicon }]
      : undefined,
    openGraph: {
      title,
      description: description?.slice(0, 160),
      siteName: tenant.config.siteName,
    },
  }
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSubdomain } = await params
  const tenant = await getTenantBySubdomain(tenantSubdomain)

  if (!tenant) {
    notFound()
  }

  // Cache the tenant for future middleware requests
  cacheTenant(tenantSubdomain)

  const primaryHex =
    tenant.config.theme?.primaryColor ||
    tenant.config.primaryColor ||
    '#3b82f6'
  const secondaryHex = tenant.config.theme?.secondaryColor || '#8b5cf6'
  const primaryHsl = hexToHsl(primaryHex)
  const primaryForegroundHsl = getPrimaryForegroundHsl(primaryHsl)
  const secondaryHsl = hexToHsl(secondaryHex)
  const fontFamily = tenant.config.theme?.fontFamily
  const isDark = tenant.config.theme?.darkMode === true
  const maintenanceMode = tenant.config.settings?.maintenanceMode === true

  const themeStyle: React.CSSProperties & Record<string, string> = {
    ['--primary']: primaryHsl,
    ['--primary-foreground']: primaryForegroundHsl,
    ['--secondary']: secondaryHsl,
  }
  if (fontFamily) {
    themeStyle.fontFamily = fontFamily
  }

  if (maintenanceMode) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center px-4 ${isDark ? 'dark' : ''}`}
        style={themeStyle}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-10 h-10 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Under Maintenance</h1>
          <p className="text-muted-foreground">
            {tenant.config.siteName} is currently being updated. Please check back soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${isDark ? 'dark' : ''}`}
      style={themeStyle}
    >
      {children}
    </div>
  )
}

