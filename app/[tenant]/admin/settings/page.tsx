'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ImageUrlOrUpload } from '@/components/image-url-or-upload'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { getTenantLink } from '@/lib/link-utils'
import { getAuthToken } from '@/lib/auth-client'
import {
  Globe,
  ExternalLink,
  Settings,
  Search,
  Palette,
  Share2,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useTenantAdmin } from '../use-tenant-admin'

export default function TenantAdminSettingsPage() {
  const { tenant, loading: tenantLoading } = useTenantAdmin()
  const [saving, setSaving] = useState(false)
  const [domainVerifying, setDomainVerifying] = useState(false)
  const [domainChecking, setDomainChecking] = useState(false)
  const [domainRemoving, setDomainRemoving] = useState(false)
  const [dnsCheck, setDnsCheck] = useState<{
    ok: boolean
    message: string
    records?: string[]
    error?: string
  } | null>(null)
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    // General
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    logo: '',
    favicon: '',
    // Custom Domain
    customDomain: '',
    customDomainVerified: false,
    // SEO
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    // Theme
    primaryColor: '',
    secondaryColor: '',
    fontFamily: '',
    darkMode: false,
    // Social
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    github: '',
    // Advanced
    analyticsId: '',
    maintenanceMode: false,
    allowComments: true,
  })

  useEffect(() => {
    const load = async () => {
      if (!tenant) return
      const token = getAuthToken()
      let domainData:
        | {
            customDomain?: string
            customDomainVerified?: boolean
            verificationCode?: string
            dnsCheck?: { ok: boolean; message: string; records?: string[]; error?: string }
          }
        | null = null

      if (token) {
        try {
          const domainRes = await fetch(`/api/tenants/${tenant.subdomain}/custom-domain`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (domainRes.ok) {
            domainData = await domainRes.json()
          }
        } catch {
          // ignore
        }
      }

      setVerificationCode(domainData?.verificationCode ?? null)
      setDnsCheck(domainData?.dnsCheck ?? null)

      setFormData({
        siteName: tenant.config.siteName || '',
        siteDescription: tenant.config.siteDescription || '',
        contactEmail: tenant.config.contactEmail || '',
        logo: tenant.config.logo || '',
        favicon: tenant.config.favicon || '',
        customDomain: domainData?.customDomain || tenant.config.customDomain || '',
        customDomainVerified:
          domainData?.customDomainVerified || tenant.config.customDomainVerified || false,
        seoTitle: tenant.config.seoTitle || '',
        seoDescription: tenant.config.seoDescription || '',
        seoKeywords: tenant.config.seoKeywords?.join(', ') || '',
        primaryColor: tenant.config.theme?.primaryColor || tenant.config.primaryColor || '',
        secondaryColor: tenant.config.theme?.secondaryColor || '',
        fontFamily: tenant.config.theme?.fontFamily || '',
        darkMode: tenant.config.theme?.darkMode || false,
        twitter: tenant.config.socialLinks?.twitter || '',
        facebook: tenant.config.socialLinks?.facebook || '',
        instagram: tenant.config.socialLinks?.instagram || '',
        linkedin: tenant.config.socialLinks?.linkedin || '',
        github: tenant.config.socialLinks?.github || '',
        analyticsId: tenant.config.analyticsId || '',
        maintenanceMode: tenant.config.settings?.maintenanceMode || false,
        allowComments: tenant.config.settings?.allowComments ?? true,
      })
    }

    load()
  }, [tenant])

  if (tenantLoading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const tokenOrThrow = () => {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Not authenticated')
    }
    return token
  }

  const handleSaveGeneral = async () => {
    setSaving(true)

    try {
      const token = tokenOrThrow()

      let logoUrl = formData.logo.trim()
      let faviconUrl = formData.favicon.trim()

      if (logoFile) {
        const form = new FormData()
        form.append('file', logoFile)
        const uploadRes = await fetch('/api/upload/cloudinary', { method: 'POST', body: form })
        const data = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(data.error || 'Logo upload failed')
        logoUrl = data.url
      }
      if (faviconFile) {
        const form = new FormData()
        form.append('file', faviconFile)
        const uploadRes = await fetch('/api/upload/cloudinary', { method: 'POST', body: form })
        const data = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(data.error || 'Favicon upload failed')
        faviconUrl = data.url
      }

      const response = await fetch(`/api/tenants/${tenant.subdomain}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          config: {
            siteName: formData.siteName,
            siteDescription: formData.siteDescription,
            contactEmail: formData.contactEmail,
            logo: logoUrl || undefined,
            favicon: faviconUrl || undefined,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to update settings')

      setFormData((prev) => ({ ...prev, logo: logoUrl, favicon: faviconUrl }))
      setLogoFile(null)
      setFaviconFile(null)
      // Simple feedback
      alert('Settings saved successfully!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSetCustomDomain = async () => {
    if (!formData.customDomain) return
    setSaving(true)

    try {
      const token = tokenOrThrow()

      const response = await fetch(`/api/tenants/${tenant.subdomain}/custom-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain: formData.customDomain }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to set custom domain')
      }

      const data = await response.json()
      setVerificationCode(data.verificationCode ?? null)
      setDnsCheck(null)
      setFormData((prev) => ({
        ...prev,
        customDomain: data.customDomain || prev.customDomain,
        customDomainVerified: false,
      }))
    } catch (error: any) {
      alert(error.message || 'Failed to set custom domain')
    } finally {
      setSaving(false)
    }
  }

  const handleCheckDns = async () => {
    setDomainChecking(true)
    try {
      const token = tokenOrThrow()
      const response = await fetch(`/api/tenants/${tenant.subdomain}/custom-domain`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      const data = await response.json()
      setDnsCheck(data.dnsCheck ?? null)
      setVerificationCode(data.verificationCode ?? verificationCode)
    } finally {
      setDomainChecking(false)
    }
  }

  const handleVerifyDomain = async () => {
    setDomainVerifying(true)

    try {
      const token = tokenOrThrow()

      const response = await fetch(`/api/tenants/${tenant.subdomain}/custom-domain`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to verify domain')

      const data = await response.json()
      setFormData((prev) => ({ ...prev, customDomainVerified: data.customDomainVerified }))
      setDnsCheck(data.dnsCheck ?? null)
      alert(data.message || 'Domain verification completed')
    } catch (error) {
      alert('Failed to verify domain')
    } finally {
      setDomainVerifying(false)
    }
  }

  const handleRemoveCustomDomain = async () => {
    if (!formData.customDomain) return
    if (
      !confirm(
        `Remove custom domain "${formData.customDomain}"? You can add it again later.`
      )
    )
      return
    setDomainRemoving(true)
    try {
      const token = tokenOrThrow()
      const response = await fetch(`/api/tenants/${tenant.subdomain}/custom-domain`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to remove domain')
      }
      setFormData((prev) => ({ ...prev, customDomain: '', customDomainVerified: false }))
      setVerificationCode(null)
      setDnsCheck(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove domain')
    } finally {
      setDomainRemoving(false)
    }
  }

  const handleSaveSection = async (section: string) => {
    setSaving(true)

    try {
      const token = tokenOrThrow()

      let config: any = {}

      if (section === 'seo') {
        config = {
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          seoKeywords: formData.seoKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
        }
      } else if (section === 'theme') {
        config = {
          theme: {
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            fontFamily: formData.fontFamily,
            darkMode: formData.darkMode,
          },
          primaryColor: formData.primaryColor, // backward compatibility
        }
      } else if (section === 'social') {
        config = {
          socialLinks: {
            twitter: formData.twitter,
            facebook: formData.facebook,
            instagram: formData.instagram,
            linkedin: formData.linkedin,
            github: formData.github,
          },
        }
      } else if (section === 'advanced') {
        config = {
          analyticsId: formData.analyticsId,
          settings: {
            maintenanceMode: formData.maintenanceMode,
            allowComments: formData.allowComments,
          },
        }
      }

      const response = await fetch(`/api/tenants/${tenant.subdomain}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      })

      if (!response.ok) throw new Error('Failed to update settings')

      alert('Settings saved successfully!')
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Site settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage all configuration for this site from here.
        </p>
      </div>

      {/* General */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white">{tenant.config.siteName}</CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                {tenant.config.siteDescription || 'Your site'}
              </CardDescription>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Globe className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Settings className="w-4 h-4" />
            <span>General</span>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site name *</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site description</Label>
              <textarea
                id="siteDescription"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.siteDescription}
                onChange={(e) =>
                  setFormData({ ...formData, siteDescription: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                placeholder="contact@example.com"
              />
            </div>
          </div>
          <div className="border-t pt-6 space-y-4">
            <h4 className="font-medium text-sm text-gray-700">Branding</h4>
            <ImageUrlOrUpload
              id="logo"
              label="Logo"
              value={formData.logo}
              onChange={(url) => {
                setLogoFile(null)
                setFormData({ ...formData, logo: url })
              }}
              onFileSelect={(file) => {
                setLogoFile(file ?? null)
                if (file) setFormData({ ...formData, logo: '' })
              }}
              placeholder="https://example.com/logo.png"
              showPreview
              previewSize="lg"
            />
            <ImageUrlOrUpload
              id="favicon"
              label="Favicon"
              value={formData.favicon}
              onChange={(url) => {
                setFaviconFile(null)
                setFormData({ ...formData, favicon: url })
              }}
              onFileSelect={(file) => {
                setFaviconFile(file ?? null)
                if (file) setFormData({ ...formData, favicon: '' })
              }}
              placeholder="https://example.com/favicon.ico"
              showPreview
              previewSize="sm"
            />
          </div>
          <ButtonWithLoader
            onClick={handleSaveGeneral}
            loading={saving}
            loadingLabel="Saving..."
            className="w-full"
          >
            Save general settings
          </ButtonWithLoader>
        </CardContent>
      </Card>

      {/* Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Domain
          </CardTitle>
          <CardDescription>
            Connect your own domain using a TXT record for verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customDomain">Custom domain</Label>
            <div className="flex gap-2">
              <Input
                id="customDomain"
                value={formData.customDomain}
                onChange={(e) =>
                  setFormData({ ...formData, customDomain: e.target.value })
                }
                placeholder="mysite.com"
              />
              <ButtonWithLoader
                onClick={handleSetCustomDomain}
                loading={saving}
                loadingLabel="Setting..."
              >
                Set domain
              </ButtonWithLoader>
            </div>
          </div>

          {formData.customDomain && (
            <div className="mt-2 p-4 bg-muted/50 rounded-lg border space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                {formData.customDomainVerified ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-orange-600">
                    <XCircle className="w-4 h-4" />
                    Pending verification
                  </span>
                )}
              </div>

              {!formData.customDomainVerified && verificationCode && (
                <>
                  <div>
                    <p className="text-sm font-medium">TXT record (for verification)</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Add this TXT record at your DNS provider – host:{' '}
                      <strong>{formData.customDomain}</strong>, value:
                    </p>
                    <code className="block p-2 rounded bg-background border text-sm break-all select-all">
                      {verificationCode}
                    </code>
                  </div>
                  {dnsCheck !== null && (
                    <>
                      <p
                        className={`text-sm ${
                          dnsCheck.ok ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      >
                        {dnsCheck.message}
                      </p>
                      {!dnsCheck.ok && dnsCheck.records && dnsCheck.records.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">
                            Current TXT record(s) for {formData.customDomain}
                          </p>
                          <ul className="space-y-1">
                            {dnsCheck.records.map((r, i) => (
                              <li key={i}>
                                <code className="block p-2 rounded bg-background border text-sm break-all">
                                  {r}
                                </code>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleCheckDns}
                      disabled={domainChecking}
                      variant="outline"
                      size="sm"
                    >
                      {domainChecking ? 'Checking...' : 'Check DNS'}
                    </Button>
                    <Button
                      onClick={handleVerifyDomain}
                      disabled={domainVerifying}
                      size="sm"
                    >
                      {domainVerifying ? 'Verifying...' : 'Verify domain'}
                    </Button>
                  </div>
                </>
              )}

              <div className="pt-2 border-t">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveCustomDomain}
                  disabled={domainRemoving}
                >
                  {domainRemoving ? 'Removing...' : 'Remove domain'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            SEO
          </CardTitle>
          <CardDescription>Defaults for title, description and keywords.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              placeholder="My amazing website"
            />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO description</Label>
            <textarea
              id="seoDescription"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.seoDescription}
              onChange={(e) =>
                setFormData({ ...formData, seoDescription: e.target.value })
              }
              placeholder="Short summary for search engines"
            />
          </div>
          <div>
            <Label htmlFor="seoKeywords">SEO keywords (comma separated)</Label>
            <Input
              id="seoKeywords"
              value={formData.seoKeywords}
              onChange={(e) =>
                setFormData({ ...formData, seoKeywords: e.target.value })
              }
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
          <ButtonWithLoader
            onClick={() => handleSaveSection('seo')}
            loading={saving}
            loadingLabel="Saving..."
            className="w-full"
          >
            Save SEO settings
          </ButtonWithLoader>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </CardTitle>
          <CardDescription>Control the colors and typography.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primary color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={formData.primaryColor || '#3b82f6'}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="secondaryColor">Secondary color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={formData.secondaryColor || '#8b5cf6'}
                onChange={(e) =>
                  setFormData({ ...formData, secondaryColor: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="fontFamily">Font family</Label>
            <select
              id="fontFamily"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.fontFamily}
              onChange={(e) =>
                setFormData({ ...formData, fontFamily: e.target.value })
              }
            >
              <option value="">Default</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="darkMode"
              checked={formData.darkMode}
              onChange={(e) =>
                setFormData({ ...formData, darkMode: e.target.checked })
              }
              className="w-4 h-4"
            />
            <Label htmlFor="darkMode">Enable dark mode</Label>
          </div>
          <ButtonWithLoader
            onClick={() => handleSaveSection('theme')}
            loading={saving}
            loadingLabel="Saving..."
            className="w-full"
          >
            Save theme settings
          </ButtonWithLoader>
        </CardContent>
      </Card>

      {/* Social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Social links
          </CardTitle>
          <CardDescription>Links used in footers or social sections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) =>
                  setFormData({ ...formData, twitter: e.target.value })
                }
                placeholder="https://twitter.com/username"
              />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) =>
                  setFormData({ ...formData, facebook: e.target.value })
                }
                placeholder="https://facebook.com/username"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin: e.target.value })
                }
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={formData.github}
                onChange={(e) =>
                  setFormData({ ...formData, github: e.target.value })
                }
                placeholder="https://github.com/username"
              />
            </div>
          </div>
          <ButtonWithLoader
            onClick={() => handleSaveSection('social')}
            loading={saving}
            loadingLabel="Saving..."
            className="w-full"
          >
            Save social links
          </ButtonWithLoader>
        </CardContent>
      </Card>

      {/* Advanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Advanced
          </CardTitle>
          <CardDescription>Analytics and maintenance options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="analyticsId">Analytics ID</Label>
            <Input
              id="analyticsId"
              value={formData.analyticsId}
              onChange={(e) =>
                setFormData({ ...formData, analyticsId: e.target.value })
              }
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={formData.maintenanceMode}
                onChange={(e) =>
                  setFormData({ ...formData, maintenanceMode: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="maintenanceMode">Enable maintenance mode</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowComments"
                checked={formData.allowComments}
                onChange={(e) =>
                  setFormData({ ...formData, allowComments: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="allowComments">Allow comments</Label>
            </div>
          </div>
          <ButtonWithLoader
            onClick={() => handleSaveSection('advanced')}
            loading={saving}
            loadingLabel="Saving..."
            className="w-full"
          >
            Save advanced settings
          </ButtonWithLoader>
        </CardContent>
      </Card>

      {/* Readonly info */}
      <Card>
        <CardHeader>
          <CardTitle>Site info</CardTitle>
          <CardDescription>Subdomain, template, and live preview link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-500">Subdomain</p>
            <p className="font-mono">{tenant.subdomain}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Template</p>
            <p className="capitalize">{tenant.template}</p>
          </div>
          <a
            href={getTenantLink(tenant, '/')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            View live site
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

