// Import all template registrations
// This file ensures all templates are registered when imported
import './ecommerce/register'
import './portfolio/register'

// Re-export template registry functions
export { getTemplate, getAllTemplates, findRouteHandler } from '@/lib/template-registry'

