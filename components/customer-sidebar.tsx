'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { 
  Package, 
  MapPin,
  User,
  Key,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from './ui/button'

interface CustomerSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onLogout?: () => void
  customerName?: string
}

export function CustomerSidebar({ activeSection, onSectionChange, onLogout, customerName }: CustomerSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  const navigation = [
    {
      id: 'orders',
      name: 'My Orders',
      icon: Package,
    },
    {
      id: 'addresses',
      name: 'Address Book',
      icon: MapPin,
    },
    {
      id: 'profile',
      name: 'Account Details',
      icon: User,
    },
    {
      id: 'password',
      name: 'Change Password',
      icon: Key,
    },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-[85px] left-4 z-50">
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
          'fixed top-[73px] left-0 z-30 h-[calc(100vh-73px)] w-64 bg-white border-r transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-6 border-b">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">My Account</h2>
              {customerName && (
                <p className="text-xs text-gray-500">{customerName}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = activeSection === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id)
                    setIsMobileOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-500')} />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </nav>

          {/* Logout */}
          {onLogout && (
            <div className="px-4 py-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
          style={{ top: '73px' }}
        />
      )}
    </>
  )
}
