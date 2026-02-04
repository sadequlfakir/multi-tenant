import { registerTemplate } from '@/lib/template-registry'
import { Tenant } from '@/lib/types'
import EcommerceHome from './index'
import { getEcommerceRoutes } from './routes'

// Register the ecommerce template
registerTemplate({
  id: 'ecommerce',
  name: 'E-Commerce',
  description: 'Complete online store with products, cart, and checkout',
  routes: getEcommerceRoutes(),
  getHomeComponent: (tenant: Tenant) => <EcommerceHome tenant={tenant} />,
})

