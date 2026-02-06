'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUrlOrUpload } from '@/components/image-url-or-upload'
import { Tenant } from '@/lib/types'
import { Settings, Globe, Search, Palette, Share2, Shield, CheckCircle2, XCircle, Trash2 } from 'lucide-react'

export default function UserSettingsPage() {
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [domainVerifying, setDomainVerifying] = useState(false)
  const [domainChecking, setDomainChecking] = useState(false)
  const [domainRemoving, setDomainRemoving] = useState(false)
  const [dnsCheck, setDnsCheck] = useState<{ ok: boolean; message: string; records?: string[]; error?: string } | null>(null)
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
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
    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }
    loadTenant(token)
  }, [router])

  const loadTenant = async (token: string) => {
    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!meRes.ok) {
        router.push('/user/login')
        return
      }

      const user = await meRes.json()
      
      if (!user.tenantId) {
        router.push('/user/create-site')
        return
      }
      
      const tenantRes = await fetch(`/api/tenants?id=${user.tenantId}`)
      if (tenantRes.ok) {
        const userTenant = await tenantRes.json()
        setTenant(userTenant)
        
        // Load custom domain status
        const domainRes = await fetch(`/api/tenants/${userTenant.subdomain}/custom-domain`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        let domainData: {
          customDomain?: string
          customDomainVerified?: boolean
          verificationCode?: string
          dnsCheck?: { ok: boolean; message: string; records?: string[]; error?: string }
        } | null = null
        if (domainRes.ok) {
          domainData = await domainRes.json()
        }
        setVerificationCode(domainData?.verificationCode ?? null)
        setDnsCheck(domainData?.dnsCheck ?? null)

        setFormData({
          siteName: userTenant.config.siteName || '',
          siteDescription: userTenant.config.siteDescription || '',
          contactEmail: userTenant.config.contactEmail || '',
          logo: userTenant.config.logo || '',
          favicon: userTenant.config.favicon || '',
          customDomain: domainData?.customDomain || userTenant.config.customDomain || '',
          customDomainVerified: domainData?.customDomainVerified || userTenant.config.customDomainVerified || false,
          seoTitle: userTenant.config.seoTitle || '',
          seoDescription: userTenant.config.seoDescription || '',
          seoKeywords: userTenant.config.seoKeywords?.join(', ') || '',
          primaryColor: userTenant.config.theme?.primaryColor || userTenant.config.primaryColor || '',
          secondaryColor: userTenant.config.theme?.secondaryColor || '',
          fontFamily: userTenant.config.theme?.fontFamily || '',
          darkMode: userTenant.config.theme?.darkMode || false,
          twitter: userTenant.config.socialLinks?.twitter || '',
          facebook: userTenant.config.socialLinks?.facebook || '',
          instagram: userTenant.config.socialLinks?.instagram || '',
          linkedin: userTenant.config.socialLinks?.linkedin || '',
          github: userTenant.config.socialLinks?.github || '',
          analyticsId: userTenant.config.analyticsId || '',
          maintenanceMode: userTenant.config.settings?.maintenanceMode || false,
          allowComments: userTenant.config.settings?.allowComments ?? true,
        })
      }
    } catch (error) {
      console.error('Failed to load tenant:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGeneral = async () => {
    if (!tenant) return
    setSaving(true)

    try {
      const token = localStorage.getItem('userToken')
      if (!token) return

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

      const updatedTenant = await response.json()
      setTenant(updatedTenant)
      setFormData((prev) => ({ ...prev, logo: logoUrl, favicon: faviconUrl }))
      setLogoFile(null)
      setFaviconFile(null)
      alert('Settings saved successfully!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSetCustomDomain = async () => {
    if (!tenant || !formData.customDomain) return
    setSaving(true)

    try {
      const token = localStorage.getItem('userToken')
      if (!token) return

      const response = await fetch(`/api/tenants/${tenant.subdomain}/custom-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain: formData.customDomain }),
      })

      if (!response.ok) {
        const error = await response.json()
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
      loadTenant(token)
    } catch (error: any) {
      alert(error.message || 'Failed to set custom domain')
    } finally {
      setSaving(false)
    }
  }

  const handleCheckDns = async () => {
    if (!tenant) return
    setDomainChecking(true)
    try {
      const token = localStorage.getItem('userToken')
      if (!token) return
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
    if (!tenant) return
    setDomainVerifying(true)

    try {
      const token = localStorage.getItem('userToken')
      if (!token) return

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
      loadTenant(token)
    } catch (error) {
      alert('Failed to verify domain')
    } finally {
      setDomainVerifying(false)
    }
  }

  const handleRemoveCustomDomain = async () => {
    if (!tenant || !formData.customDomain) return
    if (!confirm(`Remove custom domain "${formData.customDomain}"? You can add it again later.`)) return
    setDomainRemoving(true)
    try {
      const token = localStorage.getItem('userToken')
      if (!token) return
      const response = await fetch(`/api/tenants/${tenant.subdomain}/custom-domain`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to remove domain')
      }
      setFormData((prev) => ({ ...prev, customDomain: '', customDomainVerified: false }))
      setVerificationCode(null)
      setDnsCheck(null)
      loadTenant(token)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove domain')
    } finally {
      setDomainRemoving(false)
    }
  }

  const handleSaveSection = async (section: string) => {
    if (!tenant) return
    setSaving(true)

    try {
      const token = localStorage.getItem('userToken')
      if (!token) return

      let config: any = {}

      if (section === 'seo') {
        config = {
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          seoKeywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
        }
      } else if (section === 'theme') {
        config = {
          theme: {
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            fontFamily: formData.fontFamily,
            darkMode: formData.darkMode,
          },
          primaryColor: formData.primaryColor, // Keep for backward compatibility
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
      
      const updatedTenant = await response.json()
      setTenant(updatedTenant)
      alert('Settings saved successfully!')
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Tenant not found</p>
          <Button onClick={() => router.push('/user/create-site')}>Create Website</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your website configuration</p>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Settings className="w-4 h-4 shrink-0" />
              General
            </TabsTrigger>
            <TabsTrigger value="domain" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Globe className="w-4 h-4 shrink-0" />
              Domain
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Search className="w-4 h-4 shrink-0" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Palette className="w-4 h-4 shrink-0" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Share2 className="w-4 h-4 shrink-0" />
              Social
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Shield className="w-4 h-4 shrink-0" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Trash2 className="w-4 h-4 shrink-0" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic information, logo and favicon for your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="siteName">Site Name *</Label>
                    <Input
                      id="siteName"
                      value={formData.siteName}
                      onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <textarea
                      id="siteDescription"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.siteDescription}
                      onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
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
                  <p className="text-xs text-muted-foreground">
                    Logo appears in the header. Favicon appears in browser tabs (typically 32×32 or 16×16).
                  </p>
                </div>
                <ButtonWithLoader onClick={handleSaveGeneral} loading={saving} loadingLabel="Saving..." className="w-full">
                  Save General Settings
                </ButtonWithLoader>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Domain */}
          <TabsContent value="domain">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>Connect your own domain. We use a <strong>TXT</strong> record to verify you own the domain (not A/CNAME). Add the TXT below at your DNS provider, then Check DNS and Verify.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  We use a <strong>TXT</strong> record only to verify you own the domain. A and CNAME records are for pointing your domain to our servers (you may need those separately for the site to load on your domain).
                </p>
                <div>
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customDomain"
                      value={formData.customDomain}
                      onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                      placeholder="mysite.com"
                    />
                    <ButtonWithLoader onClick={handleSetCustomDomain} loading={saving} loadingLabel="Setting...">
                      Set Domain
                    </ButtonWithLoader>
                  </div>
                  {formData.customDomain && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Status:</span>
                        {formData.customDomainVerified ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <XCircle className="w-4 h-4" />
                            Pending Verification
                          </span>
                        )}
                      </div>
                      {!formData.customDomainVerified && verificationCode && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-foreground mb-1">TXT record (for verification)</p>
                            <p className="text-xs text-muted-foreground mb-1">Add a <strong>TXT</strong> record at your DNS provider — host: <strong>{formData.customDomain}</strong>, value:</p>
                            <code className="block p-2 rounded bg-background border border-border text-sm break-all select-all">
                              {verificationCode}
                            </code>
                          </div>
                          {dnsCheck !== null && (
                            <>
                              <p className={`text-sm ${dnsCheck.ok ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {dnsCheck.message}
                              </p>
                              {!dnsCheck.ok && dnsCheck.records && dnsCheck.records.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-foreground mb-1">Current TXT record(s) for {formData.customDomain}</p>
                                  <ul className="space-y-1">
                                    {dnsCheck.records.map((r, i) => (
                                      <li key={i}>
                                        <code className="block p-2 rounded bg-background border border-border text-sm break-all">
                                          {r}
                                        </code>
                                      </li>
                                    ))}
                                  </ul>
                                  <p className="text-xs text-muted-foreground mt-1">Expected value: <code className="bg-muted px-1 rounded">{verificationCode}</code></p>
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
                              {domainVerifying ? 'Verifying...' : 'Verify Domain'}
                            </Button>
                          </div>
                        </>
                      )}
                      {!formData.customDomainVerified && !verificationCode && (
                        <p className="text-sm text-muted-foreground">
                          Click &quot;Set Domain&quot; to get your verification code, then add the TXT record and use &quot;Check DNS&quot; / &quot;Verify Domain&quot;.
                        </p>
                      )}
                      <div className="pt-2 border-t border-border">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  These values are used for the browser tab title, meta description, and search results. They apply across your site unless a specific page (e.g. product) sets its own.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    placeholder="My Amazing Website"
                  />
                </div>
                <div>
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <textarea
                    id="seoDescription"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    placeholder="A brief description of your website"
                  />
                </div>
                <div>
                  <Label htmlFor="seoKeywords">SEO Keywords (comma-separated)</Label>
                  <Input
                    id="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                <ButtonWithLoader onClick={() => handleSaveSection('seo')} loading={saving} loadingLabel="Saving..." className="w-full">
                  Save SEO Settings
                </ButtonWithLoader>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Settings */}
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>Customize the look and feel of your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor || '#3b82f6'}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor || '#8b5cf6'}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <select
                    id="fontFamily"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.fontFamily}
                    onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="darkMode">Enable Dark Mode</Label>
                </div>
                <ButtonWithLoader onClick={() => handleSaveSection('theme')} loading={saving} loadingLabel="Saving..." className="w-full">
                  Save Theme Settings
                </ButtonWithLoader>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Links */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Add your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>
                <ButtonWithLoader onClick={() => handleSaveSection('social')} loading={saving} loadingLabel="Saving..." className="w-full">
                  Save Social Links
                </ButtonWithLoader>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Additional configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="analyticsId">Analytics ID (Google Analytics, etc.)</Label>
                  <Input
                    id="analyticsId"
                    value={formData.analyticsId}
                    onChange={(e) => setFormData({ ...formData, analyticsId: e.target.value })}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={formData.maintenanceMode}
                      onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowComments"
                      checked={formData.allowComments}
                      onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="allowComments">Allow Comments</Label>
                  </div>
                </div>
                <ButtonWithLoader onClick={() => handleSaveSection('advanced')} loading={saving} loadingLabel="Saving..." className="w-full">
                  Save Advanced Settings
                </ButtonWithLoader>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account / Delete account - top-level tab so it's visible */}
          <TabsContent value="account">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Delete account</CardTitle>
                <CardDescription>
                  Permanently delete your account and all related data. This will remove your user account,
                  all sessions, your website (tenant), and all its orders and customers. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Type <strong>DELETE</strong> below to confirm.
                </p>
                <Input
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="max-w-xs font-mono"
                  disabled={deleting}
                />
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== 'DELETE' || deleting}
                  onClick={async () => {
                    if (deleteConfirm !== 'DELETE') return
                    setDeleting(true)
                    try {
                      const token = localStorage.getItem('userToken')
                      if (!token) {
                        router.push('/user/login')
                        return
                      }
                      const res = await fetch('/api/users/delete-account', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                      })
                      const data = await res.json().catch(() => ({}))
                      if (!res.ok) throw new Error(data.error || 'Failed to delete account')
                      localStorage.removeItem('userToken')
                      localStorage.removeItem('userType')
                      router.push('/user/login')
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Failed to delete account')
                    } finally {
                      setDeleting(false)
                    }
                  }}
                >
                  {deleting ? 'Deleting...' : 'Permanently delete my account'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
