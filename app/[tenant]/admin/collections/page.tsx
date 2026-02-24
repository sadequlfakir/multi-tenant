'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
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
import type { Collection, Product } from '@/lib/types'
import { getAuthToken } from '@/lib/auth-client'
import { Plus, Edit, Trash2, LayoutGrid, Search, X } from 'lucide-react'
import { useTenantAdmin } from '../use-tenant-admin'

export default function TenantAdminCollectionsPage() {
  const router = useRouter()
  const { tenant, loading: tenantLoading, adminBase } = useTenantAdmin()
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productIds: [] as string[],
  })
  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    if (!tenant || tenant.template !== 'ecommerce') return
    const token = getAuthToken()
    if (!token) return

    const load = async () => {
      try {
        const [collectionsRes, productsRes] = await Promise.all([
          fetch(`/api/collections?subdomain=${tenant.subdomain}`),
          fetch(`/api/products?subdomain=${tenant.subdomain}`),
        ])
        if (collectionsRes.ok) {
          const data = await collectionsRes.json()
          setCollections(Array.isArray(data) ? data : [])
        }
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenant])

  const handleOpenDialog = (collection?: Collection) => {
    setProductSearch('')
    if (collection) {
      setEditingCollection(collection)
      setFormData({
        title: collection.title,
        description: collection.description || '',
        productIds: collection.productIds || [],
      })
    } else {
      setEditingCollection(null)
      setFormData({
        title: '',
        description: '',
        productIds: [],
      })
    }
    setIsDialogOpen(true)
  }

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === 'active'),
    [products]
  )

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return activeProducts
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    )
  }, [activeProducts, productSearch])

  const selectedProducts = useMemo(
    () =>
      formData.productIds
        .map((id) => activeProducts.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [formData.productIds, activeProducts]
  )

  const addProduct = (productId: string) => {
    if (formData.productIds.includes(productId)) return
    setFormData((prev) => ({
      ...prev,
      productIds: [...prev.productIds, productId],
    }))
  }

  const removeProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      productIds: prev.productIds.filter((id) => id !== productId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    const token = getAuthToken()
    if (!token) return
    try {
      const payload = {
        subdomain: tenant.subdomain,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        productIds: formData.productIds,
      }
      setSaving(true)
      let response
      if (editingCollection) {
        response = await fetch(`/api/collections/${editingCollection.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      }
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to save collection')
      }
      const data = await response.json().catch(() => ({}))
      if (editingCollection) {
        setCollections((prev) =>
          prev.map((c) => (c.id === editingCollection.id ? { ...c, ...data } : c))
        )
      } else {
        setCollections((prev) => [...prev, data])
      }
      setIsDialogOpen(false)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save collection')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (collectionId: string) => {
    if (!confirm('Delete this collection? It will be removed from your home page.')) return
    if (!tenant) return
    const token = getAuthToken()
    if (!token) return
    setDeletingId(collectionId)
    try {
      const response = await fetch(
        `/api/collections/${collectionId}?subdomain=${tenant.subdomain}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete collection')
      }
      setCollections((prev) => prev.filter((c) => c.id !== collectionId))
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to delete collection')
    } finally {
      setDeletingId(null)
    }
  }

  if (tenantLoading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (tenant.template !== 'ecommerce') {
    return <p className="text-gray-500">Collections are only for e-commerce sites.</p>
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home collections</h1>
          <p className="text-sm text-gray-500 mt-1">
            Collections shown on the storefront home page
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-500 to-indigo-600">
          <Plus className="w-4 h-4 mr-2" />
          Add collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <LayoutGrid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No collections yet</h3>
            <p className="text-gray-600 mb-6">
              Create collections to feature products on the homepage (e.g. New Arrivals, Best Sellers).
            </p>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-500 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Create your first collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Card key={col.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{col.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {col.description || 'No description'}
                </CardDescription>
                <p className="text-xs text-gray-500 mt-1">
                  {col.productIds?.length ?? 0} product(s)
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(col)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <ButtonWithLoader
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    loading={deletingId === col.id}
                    onClick={() => handleDelete(col.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </ButtonWithLoader>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? 'Edit collection' : 'Add collection'}
            </DialogTitle>
            <DialogDescription>
              Shown as a section on your storefront home page with title, description, and selected products.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. New Arrivals"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description for this section"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <Label>Products in this collection</Label>
              <p className="text-xs text-gray-500 mb-2">
                Search and add products. Selected products appear below; remove with ×.
              </p>
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-2 border rounded-md bg-muted/50">
                  {selectedProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border text-sm"
                    >
                      <span className="truncate max-w-[140px]">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => removeProduct(p.id)}
                        className="shrink-0 p-0.5 rounded hover:bg-muted text-gray-500 hover:text-gray-900"
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {activeProducts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No active products. Add products from{' '}
                  <button
                    type="button"
                    onClick={() => router.push(`${adminBase}/products/new`)}
                    className="text-primary underline"
                  >
                    Products → Add product
                  </button>{' '}
                  first.
                </p>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search products by name, description, SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="border rounded-md overflow-hidden max-h-52 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">No products match your search.</p>
                    ) : (
                      <ul className="divide-y">
                        {filteredProducts.map((p) => {
                          const isSelected = formData.productIds.includes(p.id)
                          return (
                            <li
                              key={p.id}
                              className="flex items-center justify-between gap-2 p-2 hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt=""
                                    className="w-10 h-10 rounded object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                                    No img
                                  </div>
                                )}
                                <span className="text-sm truncate">{p.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant={isSelected ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => (isSelected ? removeProduct(p.id) : addProduct(p.id))}
                              >
                                {isSelected ? 'Remove' : 'Add'}
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.productIds.length} selected · {filteredProducts.length} shown
                  </p>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <ButtonWithLoader
                type="submit"
                loading={saving}
                loadingLabel={editingCollection ? 'Updating...' : 'Creating...'}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {editingCollection ? 'Update collection' : 'Create collection'}
              </ButtonWithLoader>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
