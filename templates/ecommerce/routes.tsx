import { TemplateRouteHandler } from '@/lib/template-registry'
import { Tenant } from '@/lib/types'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import TrackOrder from './pages/TrackOrder'
import CustomerLogin from './pages/CustomerLogin'
import CustomerRegister from './pages/CustomerRegister'
import CustomerDashboard from './pages/CustomerDashboard'
import WishlistRedirect from './pages/WishlistRedirect'

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
      pattern: '/wishlist',
      component: (tenant: Tenant) => <WishlistRedirect tenant={tenant} />,
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
    {
      pattern: '/customer/login',
      component: (tenant: Tenant) => <CustomerLogin tenant={tenant} />,
    },
    {
      pattern: '/customer/register',
      component: (tenant: Tenant) => <CustomerRegister tenant={tenant} />,
    },
    {
      pattern: '/customer/dashboard',
      component: (tenant: Tenant) => <CustomerDashboard tenant={tenant} />,
    },
  ]
}
