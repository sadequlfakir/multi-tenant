'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tenant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { EcommerceHeader } from '@/components/ecommerce-header'

interface CustomerLoginProps {
  tenant: Tenant
}

export default function CustomerLogin({ tenant }: CustomerLoginProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          subdomain: tenant.subdomain,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token
      localStorage.setItem('customerToken', data.token)
      localStorage.setItem('customerTenantId', data.customer.tenantId)

      router.push(getTenantLink(tenant, '/customer/dashboard'))
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Customer Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to view your orders and manage your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}
              <ButtonWithLoader type="submit" className="w-full" loading={loading} loadingLabel="Logging in...">
                Login
              </ButtonWithLoader>
            </form>
            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <a href={getTenantLink(tenant, '/customer/register')} className="text-primary hover:underline">
                  Sign up
                </a>
              </p>
            </div>
            <div className="mt-2 text-center">
              <a href={getTenantLink(tenant, '/')} className="text-sm text-primary hover:underline">
                Back to Home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
