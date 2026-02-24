'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUrlOrUpload } from '@/components/image-url-or-upload'
import { Category, VariantOptionSchema, VariantOptionSet, Product } from '@/lib/types'
import { getAuthToken } from '@/lib/auth-client'
import { useTenantAdmin } from '../../use-tenant-admin'

function schemaEqual(a: VariantOptionSchema[] | undefined, b: VariantOptionSchema[] | undefined): boolean {
  if (!a?.length && !b?.length) return true
  if (!a?.length || !b?.length || a.length !== b.length) return false
  return a.every((opt, i) => {
    const o = b[i]
    if (!o || opt.name !== o.name) return false
    if (opt.values?.length !== o.values?.length) return false
    return opt.values.every((v, j) => v === o.values?.[j])
  })
}

function cartesianProduct(schema: VariantOptionSchema[]): Array<Record<string, string>> {
  if (!schema.length) return []
  const [head, ...tail] = schema.filter((s) => s.name && s.values?.length)
  if (!head) return []
  const rest = cartesianProduct(tail)
  if (!rest.length) return head.values!.map((v) => ({ [head.name]: v }))
  return head.values!.flatMap((v) => rest.map((r) => ({ [head.name]: v, ...r })))
}

export default function TenantAdminEditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string; tenant: string }>()
  const productId = params?.id
  const { tenant, loading, adminBase } = useTenantAdmin()

  const [categories, setCategories] = useState<Category[]>([])
  const [variantOptionSets, setVariantOptionSets] = useState<VariantOptionSet[]>([])
  const [productLoading, setProductLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    stock: '',
    sku: '',
    slug: '',
    featured: false,
    status: 'active' as Product['status'],
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  })
  const [selectedVariantSetId, setSelectedVariantSetId] = useState<string>('')
  const [variantSchema, setVariantSchema] = useState<VariantOptionSchema[]>([])
  const [variants, setVariants] = useState<
    Array<{ options: Record<string, string>; sku?: string; priceAdjustment: number; stock?: number }>
  >([])

  useEffect(() => {
    if (loading || !tenant || tenant.template !== 'ecommerce' || !productId) return

    const token = getAuthToken()
    if (!token) return

    const loadData = async () => {
      try {
        const [categoriesRes, variantSetsRes, productRes] = await Promise.all([
          fetch(`/api/categories?subdomain=${tenant.subdomain}`),
          fetch(`/api/variant-option-sets?subdomain=${tenant.subdomain}`),
          fetch(`/api/products/${productId}?subdomain=${encodeURIComponent(tenant.subdomain)}`),
        ])

        if (!productRes.ok) {
          router.replace(`${adminBase}/products`)
          return
        }

        const full = (await productRes.json()) as Product
        if (!full?.id) {
          router.replace(`${adminBase}/products`)
          return
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
        let variantSetsData: VariantOptionSet[] = []
        if (variantSetsRes.ok) {
          variantSetsData = await variantSetsRes.json()
          setVariantOptionSets(variantSetsData)
        }

        setFormData({
          name: full.name,
          description: full.description || '',
          price: full.price.toString(),
          image: full.image || '',
          category: full.category || '',
          stock: full.stock?.toString() || '',
          sku: full.sku || '',
          slug: full.slug || '',
          featured: full.featured || false,
          status: full.status || 'active',
          seoTitle: full.seoTitle || '',
          seoDescription: full.seoDescription || '',
          seoKeywords: Array.isArray(full.seoKeywords)
            ? full.seoKeywords.join(', ')
            : '',
        })
        const schema = full.variantSchema ?? []
        setVariantSchema(schema)
        setVariants(
          (full.variants ?? []).map((v) => ({
            options: v.options ?? {},
            sku: v.sku,
            priceAdjustment: v.priceAdjustment ?? 0,
            stock: v.stock,
          }))
        )
        const matching = variantSetsData.find((s) => schemaEqual(s.schema, schema))
        setSelectedVariantSetId(matching?.id ?? '')
      } catch (error) {
        console.error('Failed to load product:', error)
        router.replace(`${adminBase}/products`)
      } finally {
        setProductLoading(false)
      }
    }

    loadData()
  }, [loading, tenant, productId, adminBase, router])

  const onVariantSetChange = (setId: string) => {
    setSelectedVariantSetId(setId)
    if (!setId) {
      setVariantSchema([])
      setVariants([])
      return
    }
    const set = variantOptionSets.find((s) => s.id === setId)
    if (!set?.schema?.length) {
      setVariantSchema([])
      setVariants([])
      return
    }
    setVariantSchema(set.schema)
    const combos = cartesianProduct(set.schema)
    const existingByKey = new Map(variants.map((v) => [JSON.stringify(v.options), v]))
    const newVariants = combos.map((options) => {
      const key = JSON.stringify(options)
      const existing = existingByKey.get(key)
      return {
        options,
        sku: existing?.sku,
        priceAdjustment: existing?.priceAdjustment ?? 0,
        stock: existing?.stock,
      }
    })
    setVariants(newVariants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant || !productId) return

    const token = getAuthToken()
    if (!token) return

    setSaving(true)
    try {
      let imageUrl = formData.image.trim()
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
        description: formData.description.trim(),
        price: parseFloat(formData.price) || 0,
        image: imageUrl,
        category: formData.category.trim() || undefined,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        sku: formData.sku.trim() || undefined,
        featured: formData.featured,
        status: formData.status,
        slug: formData.slug.trim() || undefined,
        seoTitle: formData.seoTitle.trim() || undefined,
        seoDescription: formData.seoDescription.trim() || undefined,
        seoKeywords: formData.seoKeywords
          ? formData.seoKeywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
          : undefined,
        variantSchema: variantSchema.length > 0 ? variantSchema : undefined,
        variants: variants.length > 0 ? variants : undefined,
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }

      router.push(`${adminBase}/products`)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (tenant.template !== 'ecommerce' || !productId) {
    return null
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
          <CardDescription>Update your product details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Product description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <ImageUrlOrUpload
              id="image"
              label="Image"
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
              previewSize="lg"
            />
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU-001"
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <Label htmlFor="variant-set">Variant set</Label>
              <select
                id="variant-set"
                value={selectedVariantSetId}
                onChange={(e) => onVariantSetChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {variantOptionSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {variantSchema.length > 0 && variants.length > 0 && (
                <div>
                  <Label className="mb-2 block">
                    Variant rows — set SKU, price adjustment (±), and stock for each
                  </Label>
                  <div className="max-h-56 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium">Options</th>
                          <th className="text-left p-2 font-medium w-28">SKU</th>
                          <th className="text-left p-2 font-medium w-24">Price (±)</th>
                          <th className="text-left p-2 font-medium w-20">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, idx) => (
                          <tr key={idx} className="border-t border-border">
                            <td className="p-2 text-muted-foreground">
                              {Object.entries(v.options)
                                .map(([k, val]) => `${k}: ${val}`)
                                .join(' · ')}
                            </td>
                            <td className="p-2">
                              <Input
                                placeholder="SKU"
                                value={v.sku ?? ''}
                                onChange={(e) => {
                                  const next = [...variants]
                                  next[idx] = {
                                    ...next[idx],
                                    sku: e.target.value.trim() || undefined,
                                  }
                                  setVariants(next)
                                }}
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={v.priceAdjustment === 0 ? '' : v.priceAdjustment}
                                onChange={(e) => {
                                  const next = [...variants]
                                  next[idx] = {
                                    ...next[idx],
                                    priceAdjustment:
                                      parseFloat(e.target.value) || 0,
                                  }
                                  setVariants(next)
                                }}
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={v.stock ?? ''}
                                onChange={(e) => {
                                  const next = [...variants]
                                  const val = e.target.value
                                  next[idx] = {
                                    ...next[idx],
                                    stock:
                                      val === '' ? undefined : parseInt(val, 10),
                                  }
                                  setVariants(next)
                                }}
                                className="h-8 text-xs"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                <Label htmlFor="status" className="sr-only">
                  Status
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as Product['status'],
                    })
                  }
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">URL Slug (optional)</p>
              <div>
                <Label htmlFor="slug">Product Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="product-name-slug (auto-generated from name if empty)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  SEO-friendly URL. Leave empty to auto-generate from product name.
                </p>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">SEO (optional)</p>
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, seoTitle: e.target.value })
                  }
                  placeholder="Custom meta title"
                />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO Description</Label>
                <textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, seoDescription: e.target.value })
                  }
                  placeholder="Custom meta description"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="seoKeywords">SEO Keywords (comma-separated)</Label>
                <Input
                  id="seoKeywords"
                  value={formData.seoKeywords}
                  onChange={(e) =>
                    setFormData({ ...formData, seoKeywords: e.target.value })
                  }
                  placeholder="keyword1, keyword2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`${adminBase}/products`)}
              >
                Cancel
              </Button>
              <ButtonWithLoader
                type="submit"
                loading={saving}
                loadingLabel="Updating..."
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                Update Product
              </ButtonWithLoader>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
