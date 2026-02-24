'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getTenantLink } from '@/lib/link-utils'
import type { Tenant } from '@/lib/types'

export default function TenantAdminLoginPage() {
  const params = useParams()
  const subdomain = params?.tenant as string

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Same-origin request (tenant is served by same app) so no CORS / "Failed to fetch"
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          type: 'user',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token on this origin; also set cookie so main-app sidebar links (Products, Orders, etc.) work
      const { setAuthToken } = await import('@/lib/auth-client')
      setAuthToken(data.token)
      localStorage.setItem('userType', 'user')

      // Stay on tenant: go to site admin dashboard (own context, same origin)
      const adminPath = getTenantLink({ subdomain } as Tenant, '/admin')
      window.location.href = window.location.origin + adminPath
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md border-2 shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Site admin</CardTitle>
          <CardDescription>
            Sign in with your account to manage this site
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
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
            <ButtonWithLoader
              type="submit"
              className="w-full"
              loading={loading}
              loadingLabel="Signing in..."
            >
              Sign in
            </ButtonWithLoader>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Use the same email and password as your main account.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
