'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ImageUrlOrUpload } from '@/components/image-url-or-upload'
import { Category, Tenant } from '@/lib/types'
import { Plus, Edit, Trash2, FolderKanban } from 'lucide-react'

export default function CategoriesManagementPage() {
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    order: '',
    featured: false,
    status: 'active' as Category['status'],
  })

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
          const categoriesRes = await fetch(
            `/api/categories?subdomain=${userTenant.subdomain}`
          )
          if (categoriesRes.ok) {
            const categoriesData = await categoriesRes.json()
            setCategories(categoriesData)
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

  const handleOpenDialog = (category?: Category) => {
    setImageFile(null)
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image: category.image || '',
        order: category.order?.toString() ?? '',
        featured: category.featured || false,
        status: category.status || 'active',
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        image: '',
        order: String(categories.length),
        featured: false,
        status: 'active',
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return

    const token = localStorage.getItem('userToken')
    if (!token) return

    try {
      let imageUrl = formData.image.trim() || undefined
      if (imageFile) {
        const form = new FormData()
        form.append('file', imageFile)
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
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        description: formData.description.trim() || undefined,
        image: imageUrl,
        order: formData.order ? parseInt(formData.order) : undefined,
        featured: formData.featured,
        status: formData.status,
      }

      let response
      if (editingCategory) {
        response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save category')
      }

      setImageFile(null)
      setIsDialogOpen(false)
      loadData(token)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save category')
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    if (!tenant) return

    const token = localStorage.getItem('userToken')
    if (!token) return

    try {
      const response = await fetch(
        `/api/categories/${categoryId}?subdomain=${tenant.subdomain}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      loadData(token)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to delete category')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
              <p className="text-sm text-gray-500 mt-1">
                Organize your products with categories
              </p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {categories.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Categories Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add categories to organize your products (e.g. Electronics, Clothing).
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video w-full bg-gray-100 relative">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderKanban className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>
                    /{category.slug}
                    {category.featured && (
                      <span className="ml-2 text-blue-600">Featured</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update category details'
                : 'Add a category to organize products'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug:
                      formData.slug === '' || editingCategory?.slug === formData.slug
                        ? e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        : formData.slug,
                  })
                }}
                placeholder="e.g. Electronics"
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="electronics"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly name (auto-filled from name if left empty)
              </p>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <ImageUrlOrUpload
              id="image"
              label="Image URL"
              value={formData.image}
              onChange={(url) => {
                setImageFile(null)
                setFormData({ ...formData, image: url })
              }}
              onFileSelect={(file) => {
                setImageFile(file ?? null)
                if (file) setFormData({ ...formData, image: '' })
              }}
              placeholder="https://example.com/image.jpg"
              showPreview
            />
            <div>
              <Label htmlFor="order">Display order</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="rounded border-input"
                />
                <span className="text-sm">Featured</span>
              </label>
              <div>
                <Label htmlFor="status" className="sr-only">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as Category['status'],
                    })
                  }
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
