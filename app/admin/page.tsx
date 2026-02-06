'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { Tenant } from '@/lib/types'

export default function AdminPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [templates, setTemplates] = useState<Tenant[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    template: 'ecommerce',
    siteName: '',
    siteDescription: '',
    isTemplate: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }

    // Verify token is valid
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.ok) {
          setAuthenticated(true)
          setLoadError(null)
          // Load all tenants from Supabase
          fetch('/api/tenants')
            .then(async (r) => {
              const data = await r.json().catch(() => ({}))
              if (!r.ok) throw new Error((data && data.error) || 'Failed to load tenants')
              return data
            })
            .then((data) => setTenants(Array.isArray(data) ? data : []))
            .catch((err) => {
              setTenants([])
              setLoadError(err.message || 'Could not load tenants')
            })
          // Load template tenants (isTemplate=true)
          fetch('/api/tenants?isTemplate=true')
            .then(r => r.ok ? r.json() : [])
            .then((data) => setTemplates(Array.isArray(data) ? data : []))
            .catch(() => setTemplates([]))
        } else {
          router.push('/user/login')
        }
      })
      .catch(() => router.push('/user/login'))
      .finally(() => setLoading(false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          subdomain: formData.subdomain,
          template: formData.template,
          config: {
            siteName: formData.siteName || formData.name,
            siteDescription: formData.siteDescription,
          },
          isTemplate: formData.isTemplate,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create site')
      }

      const tenant = await response.json()
      setSuccess(`Site created successfully!`)
      // Refresh lists from Supabase so new tenant/template appears
      const [allRes, templateRes] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/tenants?isTemplate=true'),
      ])
      if (allRes.ok) {
        const data = await allRes.json()
        setTenants(Array.isArray(data) ? data : [])
      }
      if (templateRes.ok) {
        const data = await templateRes.json()
        setTemplates(Array.isArray(data) ? data : [])
      }
      setTimeout(() => {
        router.push('/user/dashboard')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to create site')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 shrink-0 animate-spin" aria-hidden />
        <span>Loading...</span>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Create Your Website</CardTitle>
              <CardDescription>
                Choose a template and customize your site settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Site Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Awesome Store"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subdomain">Subdomain *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="mysite"
                      required
                      pattern="[a-z0-9-]+"
                    />
                    <span className="text-gray-500">.yourdomain.com</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>

                <div>
                  <Label htmlFor="template">Template *</Label>
                  <select
                    id="template"
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value as 'ecommerce' | 'portfolio' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="ecommerce">E-Commerce</option>
                    <option value="portfolio">Portfolio</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.template === 'ecommerce'
                      ? 'Online store with products, cart, and checkout.'
                      : 'Portfolio layout for showcasing projects.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="isTemplate"
                    type="checkbox"
                    checked={formData.isTemplate}
                    onChange={(e) => setFormData({ ...formData, isTemplate: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isTemplate">Save as reusable template</Label>
                </div>

                <div>
                  <Label htmlFor="siteName">Display Name</Label>
                  <Input
                    id="siteName"
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                    placeholder="Leave empty to use site name"
                  />
                </div>

                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <textarea
                    id="siteDescription"
                    value={formData.siteDescription}
                    onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="A brief description of your site"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
                    {success}
                  </div>
                )}

                <ButtonWithLoader type="submit" className="w-full" size="lg" loading={submitting} loadingLabel="Creating...">
                  Create Site
                </ButtonWithLoader>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 space-y-8">
            {loadError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                {loadError} — Check Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) and run migrations.
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-6">All Tenants (from Supabase)</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.length === 0 && !loadError && (
                  <p className="text-gray-500 col-span-full">No tenants yet. Create one above.</p>
                )}
                {tenants.map((t) => (
                  <Card key={t.id}>
                    <CardHeader>
                      <CardTitle>{t.config?.siteName || t.name}</CardTitle>
                      <CardDescription>
                        {t.subdomain} · {t.template}
                        {t.isTemplate ? ' · Template' : ''}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6">Available Templates</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.length === 0 && (
                  <p className="text-gray-500 col-span-full">No templates. Create a site and check &quot;Save as reusable template&quot;.</p>
                )}
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle>{template.config?.siteName || template.name}</CardTitle>
                      <CardDescription>
                        {template.config?.siteDescription || `Template (${template.template})`}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

