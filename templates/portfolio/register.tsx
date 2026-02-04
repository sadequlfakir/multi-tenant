import { registerTemplate } from '@/lib/template-registry'
import { Tenant } from '@/lib/types'
import PortfolioHome from './index'
import { getPortfolioRoutes } from './routes'

// Register the portfolio template
registerTemplate({
  id: 'portfolio',
  name: 'Portfolio',
  description: 'Showcase your work with a beautiful portfolio website',
  routes: getPortfolioRoutes(),
  getHomeComponent: (tenant: Tenant) => <PortfolioHome tenant={tenant} />,
})

