'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ImageUrlOrUpload } from '@/components/image-url-or-upload'
import { Slider, Banner, Tenant } from '@/lib/types'
import { Plus, Edit, Trash2, Image } from 'lucide-react'

type SliderFormData = {
  title: string
  description: string
  image: string
  link: string
  buttonText: string
  order: string
  status: Slider['status']
}

type BannerFormData = {
  title: string
  description: string
  image: string
  link: string
  buttonText: string
  position: Banner['position']
  status: Banner['status']
}

const defaultSliderForm: SliderFormData = {
  title: '',
  description: '',
  image: '',
  link: '',
  buttonText: 'Learn More',
  order: '0',
  status: 'active',
}

const defaultBannerForm: BannerFormData = {
  title: '',
  description: '',
  image: '',
  link: '',
  buttonText: 'Learn More',
  position: 'after-categories',
  status: 'active',
}

export default function BannersManagementPage() {
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [sliders, setSliders] = useState<Slider[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [sliderDialogOpen, setSliderDialogOpen] = useState(false)
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [sliderImageFile, setSliderImageFile] = useState<File | null>(null)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)
  const [sliderForm, setSliderForm] = useState<SliderFormData>(defaultSliderForm)
  const [bannerForm, setBannerForm] = useState<BannerFormData>(defaultBannerForm)

  useEffect(() => {
    const token = localStorage.getItem('userToken')
    if (!token) {
      router.push('/user/login')
      return
    }
    loadData(token)
  }, [router])

  const loadData = async (token: string) => {
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

        if (userTenant.template === 'ecommerce') {
          const [slidersRes, bannersRes] = await Promise.all([
            fetch(`/api/sliders?subdomain=${userTenant.subdomain}`),
            fetch(`/api/banners?subdomain=${userTenant.subdomain}`),
          ])
          if (slidersRes.ok) {
            const slidersData = await slidersRes.json()
            setSliders(slidersData)
          }
          if (bannersRes.ok) {
            const bannersData = await bannersRes.json()
            setBanners(bannersData)
          }
        } else {
          router.push('/user/dashboard')
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openSliderDialog = (slider?: Slider) => {
    setSliderImageFile(null)
    if (slider) {
      setEditingSlider(slider)
      setSliderForm({
        title: slider.title || '',
        description: slider.description || '',
        image: slider.image || '',
        link: slider.link || '',
        buttonText: slider.buttonText || 'Learn More',
        order: String(slider.order ?? 0),
        status: slider.status || 'active',
      })
    } else {
      setEditingSlider(null)
      setSliderForm({
        ...defaultSliderForm,
        order: String(sliders.length),
      })
    }
    setSliderDialogOpen(true)
  }

  const openBannerDialog = (banner?: Banner) => {
    setBannerImageFile(null)
    if (banner) {
      setEditingBanner(banner)
      setBannerForm({
        title: banner.title || '',
        description: banner.description || '',
        image: banner.image || '',
        link: banner.link || '',
        buttonText: banner.buttonText || 'Learn More',
        position: banner.position,
        status: banner.status || 'active',
      })
    } else {
      setEditingBanner(null)
      setBannerForm(defaultBannerForm)
    }
    setBannerDialogOpen(true)
  }

  const handleSliderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return

    const token = localStorage.getItem('userToken')
    if (!token) return

    try {
      let imageUrl = sliderForm.image.trim()
      if (sliderImageFile) {
        const form = new FormData()
        form.append('file', sliderImageFile)
        const uploadRes = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: form,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed')
        imageUrl = uploadData.url
      }

      const payload = {
        subdomain: tenant.subdomain,
        title: sliderForm.title.trim(),
        description: sliderForm.description.trim(),
        image: imageUrl,
        link: sliderForm.link.trim(),
        buttonText: sliderForm.buttonText.trim() || 'Learn More',
        order: parseInt(sliderForm.order) || 0,
        status: sliderForm.status,
      }

      const url = editingSlider
        ? `/api/sliders/${editingSlider.id}`
        : '/api/sliders'
      const method = editingSlider ? 'PUT' : 'POST'
      const body = editingSlider ? payload : { ...payload, subdomain: tenant.subdomain }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save slider')
      }

      setSliderImageFile(null)
      setSliderDialogOpen(false)
      loadData(token)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save slider')
    }
  }

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return

    const token = localStorage.getItem('userToken')
    if (!token) return

    try {
      let imageUrl = bannerForm.image.trim()
      if (bannerImageFile) {
        const form = new FormData()
        form.append('file', bannerImageFile)
        const uploadRes = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: form,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed')
        imageUrl = uploadData.url
      }

      if (!imageUrl) {
        throw new Error('Image is required')
      }

      const payload = {
        subdomain: tenant.subdomain,
        title: bannerForm.title.trim(),
        description: bannerForm.description.trim(),
        image: imageUrl,
        link: bannerForm.link.trim(),
        buttonText: bannerForm.buttonText.trim() || 'Learn More',
        position: bannerForm.position,
        status: bannerForm.status,
      }

      const url = editingBanner
        ? `/api/banners/${editingBanner.id}`
        : '/api/banners'
      const method = editingBanner ? 'PUT' : 'POST'
      const body = editingBanner ? payload : { ...payload, subdomain: tenant.subdomain }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save banner')
      }

      setBannerImageFile(null)
      setBannerDialogOpen(false)
      loadData(token)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save banner')
    }
  }

  const deleteSlider = async (id: string) => {
    if (!confirm('Delete this slider?')) return
    if (!tenant) return
    const token = localStorage.getItem('userToken')
    if (!token) return
    try {
      const res = await fetch(
        `/api/sliders/${id}?subdomain=${tenant.subdomain}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error((await res.json()).error)
      loadData(token)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    if (!tenant) return
    const token = localStorage.getItem('userToken')
    if (!token) return
    try {
      const res = await fetch(
        `/api/banners/${id}?subdomain=${tenant.subdomain}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error((await res.json()).error)
      loadData(token)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Banners & Sliders
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Homepage sliders and section banners
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="sliders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sliders">Sliders ({sliders.length})</TabsTrigger>
            <TabsTrigger value="banners">Banners ({banners.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="sliders" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => openSliderDialog()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Slider
              </Button>
            </div>
            {sliders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No sliders yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add slider images for your homepage hero.
                  </p>
                  <Button
                    onClick={() => openSliderDialog()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slider
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sliders.map((s) => (
                  <Card key={s.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100">
                      {s.image ? (
                        <img
                          src={s.image}
                          alt={s.title || 'Slider'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{s.title || 'Untitled'}</CardTitle>
                      <CardDescription>{s.description || '—'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openSliderDialog(s)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => deleteSlider(s.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => openBannerDialog()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Banner
              </Button>
            </div>
            {banners.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No banners yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add banners (after categories or after products sections).
                  </p>
                  <Button
                    onClick={() => openBannerDialog()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Banner
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((b) => (
                  <Card key={b.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100">
                      {b.image ? (
                        <img
                          src={b.image}
                          alt={b.title || 'Banner'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{b.title || 'Untitled'}</CardTitle>
                      <CardDescription>
                        {b.position === 'after-categories'
                          ? 'After categories'
                          : 'After products'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openBannerDialog(b)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => deleteBanner(b.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={sliderDialogOpen} onOpenChange={setSliderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlider ? 'Edit Slider' : 'Add Slider'}
            </DialogTitle>
            <DialogDescription>
              Homepage hero slider image and text.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSliderSubmit} className="space-y-4">
            <div>
              <Label htmlFor="slider-title">Title</Label>
              <Input
                id="slider-title"
                value={sliderForm.title}
                onChange={(e) =>
                  setSliderForm({ ...sliderForm, title: e.target.value })
                }
                placeholder="Slide title"
              />
            </div>
            <div>
              <Label htmlFor="slider-desc">Description</Label>
              <textarea
                id="slider-desc"
                value={sliderForm.description}
                onChange={(e) =>
                  setSliderForm({ ...sliderForm, description: e.target.value })
                }
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <ImageUrlOrUpload
              id="slider-image"
              label="Image URL *"
              value={sliderForm.image}
              onChange={(url) => {
                setSliderImageFile(null)
                setSliderForm({ ...sliderForm, image: url })
              }}
              onFileSelect={(file) => {
                setSliderImageFile(file ?? null)
                if (file) setSliderForm({ ...sliderForm, image: '' })
              }}
              placeholder="https://..."
              required
              showPreview
            />
            <div>
              <Label htmlFor="slider-link">Link</Label>
              <Input
                id="slider-link"
                type="url"
                value={sliderForm.link}
                onChange={(e) =>
                  setSliderForm({ ...sliderForm, link: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="slider-btn">Button text</Label>
              <Input
                id="slider-btn"
                value={sliderForm.buttonText}
                onChange={(e) =>
                  setSliderForm({ ...sliderForm, buttonText: e.target.value })
                }
                placeholder="Learn More"
              />
            </div>
            <div>
              <Label htmlFor="slider-order">Order</Label>
              <Input
                id="slider-order"
                type="number"
                min="0"
                value={sliderForm.order}
                onChange={(e) =>
                  setSliderForm({ ...sliderForm, order: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="slider-status">Status</Label>
              <select
                id="slider-status"
                value={sliderForm.status}
                onChange={(e) =>
                  setSliderForm({
                    ...sliderForm,
                    status: e.target.value as Slider['status'],
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSliderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {editingSlider ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Edit Banner' : 'Add Banner'}
            </DialogTitle>
            <DialogDescription>
              Section banner (after categories or after products).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBannerSubmit} className="space-y-4">
            <div>
              <Label htmlFor="banner-title">Title</Label>
              <Input
                id="banner-title"
                value={bannerForm.title}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, title: e.target.value })
                }
                placeholder="Banner title"
              />
            </div>
            <div>
              <Label htmlFor="banner-desc">Description</Label>
              <textarea
                id="banner-desc"
                value={bannerForm.description}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, description: e.target.value })
                }
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <ImageUrlOrUpload
              id="banner-image"
              label="Image URL *"
              value={bannerForm.image}
              onChange={(url) => {
                setBannerImageFile(null)
                setBannerForm({ ...bannerForm, image: url })
              }}
              onFileSelect={(file) => {
                setBannerImageFile(file ?? null)
                if (file) setBannerForm({ ...bannerForm, image: '' })
              }}
              placeholder="https://..."
              required
              showPreview
            />
            <div>
              <Label htmlFor="banner-position">Position *</Label>
              <select
                id="banner-position"
                value={bannerForm.position}
                onChange={(e) =>
                  setBannerForm({
                    ...bannerForm,
                    position: e.target.value as Banner['position'],
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="after-categories">After categories</option>
                <option value="after-products">After products</option>
              </select>
            </div>
            <div>
              <Label htmlFor="banner-link">Link</Label>
              <Input
                id="banner-link"
                type="url"
                value={bannerForm.link}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, link: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="banner-btn">Button text</Label>
              <Input
                id="banner-btn"
                value={bannerForm.buttonText}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, buttonText: e.target.value })
                }
                placeholder="Learn More"
              />
            </div>
            <div>
              <Label htmlFor="banner-status">Status</Label>
              <select
                id="banner-status"
                value={bannerForm.status}
                onChange={(e) =>
                  setBannerForm({
                    ...bannerForm,
                    status: e.target.value as Banner['status'],
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBannerDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {editingBanner ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
