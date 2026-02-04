import { TemplateRouteHandler } from '@/lib/template-registry'
import { Tenant } from '@/lib/types'
import About from './pages/About'
import Projects from './pages/Projects'
import Contact from './pages/Contact'

export function getPortfolioRoutes(): TemplateRouteHandler[] {
  return [
    {
      pattern: '/about',
      component: (tenant: Tenant) => <About tenant={tenant} />,
    },
    {
      pattern: '/projects',
      component: (tenant: Tenant) => <Projects tenant={tenant} />,
    },
    {
      pattern: '/contact',
      component: (tenant: Tenant) => <Contact tenant={tenant} />,
    },
  ]
}
