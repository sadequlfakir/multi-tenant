import { Tenant } from './types'
import { ReactElement } from 'react'

export interface TemplateRouteHandler {
  pattern: string // e.g., '/products', '/products/[id]', '/cart'
  component: (tenant: Tenant, params?: Record<string, string>) => ReactElement
}

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  routes: TemplateRouteHandler[]
  getHomeComponent: (tenant: Tenant) => ReactElement
}

// Template registry - add new templates here
const templates: Map<string, TemplateDefinition> = new Map()

export function registerTemplate(template: TemplateDefinition) {
  templates.set(template.id, template)
}

export function getTemplate(id: string): TemplateDefinition | null {
  return templates.get(id) || null
}

export function getAllTemplates(): TemplateDefinition[] {
  return Array.from(templates.values())
}

/**
 * Matches a path against a route pattern
 * Supports patterns like '/products', '/products/[id]', '/cart'
 */
function matchRoute(pattern: string, path: string): { match: boolean; params: Record<string, string> } {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  
  if (patternParts.length !== pathParts.length) {
    return { match: false, params: {} }
  }
  
  const params: Record<string, string> = {}
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]
    
    if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      // Dynamic segment like [id]
      const paramName = patternPart.slice(1, -1)
      params[paramName] = pathPart
    } else if (patternPart !== pathPart) {
      return { match: false, params: {} }
    }
  }
  
  return { match: true, params }
}

/**
 * Finds the matching route handler for a given path
 */
export function findRouteHandler(
  templateId: string,
  path: string
): { handler: TemplateRouteHandler; params: Record<string, string> } | null {
  const template = getTemplate(templateId)
  if (!template) return null
  
  // Try to find exact match first
  for (const route of template.routes) {
    const result = matchRoute(route.pattern, path)
    if (result.match) {
      return { handler: route, params: result.params }
    }
  }
  
  return null
}
