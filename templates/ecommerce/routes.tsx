import { TemplateRouteHandler } from '@/lib/template-registry'
import { Tenant } from '@/lib/types'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import TrackOrder from './pages/TrackOrder'

export function getEcommerceRoutes(): TemplateRouteHandler[] {
  return [
    {
      pattern: '/products',
      component: (tenant: Tenant) => <Products tenant={tenant} />,
    },
    {
      pattern: '/products/[id]',
      component: (tenant: Tenant, params?: Record<string, string>) => (
        <ProductDetail tenant={tenant} productId={params?.id || ''} />
      ),
    },
    {
      pattern: '/cart',
      component: (tenant: Tenant) => <Cart tenant={tenant} />,
    },
    {
      pattern: '/checkout',
      component: (tenant: Tenant) => <Checkout tenant={tenant} />,
    },
    {
      pattern: '/order-success',
      component: (tenant: Tenant) => (
        <OrderSuccess tenant={tenant} />
      ),
    },
    {
      pattern: '/track-order',
      component: (tenant: Tenant) => <TrackOrder tenant={tenant} />,
    },
  ]
}
