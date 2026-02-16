import { Tenant, Product } from './types'
import { getTenantLink } from './link-utils'

/**
 * Get product URL using slug if available, otherwise fallback to ID
 */
export function getProductLink(tenant: Tenant, product: Product): string {
  const identifier = product.slug || product.id
  return getTenantLink(tenant, `/products/${identifier}`)
}
