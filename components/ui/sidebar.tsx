'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Settings, 
  Package, 
  FolderKanban, 
  LayoutGrid,
  Globe, 
  ExternalLink,
  Menu,
  X,
  LogOut,
  Image,
  ShoppingBag,
  Users
} from 'lucide-react'
import { Button } from './button'

interface SidebarProps {
  tenant?: {
    subdomain: string
    template: 'ecommerce' | 'portfolio'
  } | null
  onLogout?: () => void
}

export function Sidebar({ tenant, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/user/dashboard',
      icon: LayoutDashboard,
    },
    ...(tenant?.template === 'ecommerce'
      ? [
          {
            name: 'Products',
            href: '/user/products',
            icon: Package,
          },
          {
            name: 'Categories',
            href: '/user/categories',
            icon: FolderKanban,
          },
          {
            name: 'Home Collections',
            href: '/user/collections',
            icon: LayoutGrid,
          },
          {
            name: 'Banners & Sliders',
            href: '/user/banners',
            icon: Image,
          },
          {
            name: 'Orders',
            href: '/user/orders',
            icon: ShoppingBag,
          },
          {
            name: 'Customers',
            href: '/user/customers',
            icon: Users,
          },
        ]
      : []),
    ...(tenant?.template === 'portfolio'
      ? [
          {
            name: 'Projects',
            href: '/user/projects',
            icon: FolderKanban,
          },
        ]
      : []),
    {
      name: 'Settings',
      href: '/user/settings',
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 px-6 py-6 border-b">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
              <p className="text-xs text-gray-500">Control Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t space-y-2">
            {tenant && (() => {
              const getSiteUrl = () => {
                if (typeof window === 'undefined') {
                  return `http://${tenant.subdomain}.localhost:3000`
                }
                const hostname = window.location.hostname
                const port = window.location.port ? `:${window.location.port}` : ''
                const protocol = window.location.protocol
                // Extract base domain
                const parts = hostname.split('.')
                const baseDomain = parts.length > 1 && parts[parts.length - 1] === 'localhost' 
                  ? 'localhost' 
                  : parts.slice(-2).join('.') || 'localhost'
                return `${protocol}//${tenant.subdomain}.${baseDomain}${port}`
              }
              return (
                <a
                  href={getSiteUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                  View Live Site
                </a>
              )
            })()}
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
