'use client'

import Link from 'next/link'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ReactNode } from 'react'

interface TenantLinkProps {
  tenant: Tenant
  href: string
  children: ReactNode
  className?: string
  [key: string]: any
}

export default function TenantLink({ tenant, href, children, className, ...props }: TenantLinkProps) {
  const link = getTenantLink(tenant, href)
  return (
    <Link href={link} className={className} {...props}>
      {children}
    </Link>
  )
}
