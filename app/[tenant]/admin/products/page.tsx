'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Product, Category } from '@/lib/types'
import { getAuthToken } from '@/lib/auth-client'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { useTenantAdmin } from '../use-tenant-admin'

export default function TenantAdminProductsPage() {
  const router = useRouter()
  const { tenant, loading: tenantLoading, adminBase } = useTenantAdmin()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!tenant || tenant.template !== 'ecommerce') return
    const token = getAuthToken()
    if (!token) return

    const load = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`/api/products?subdomain=${tenant.subdomain}`),
          fetch(`/api/categories?subdomain=${tenant.subdomain}`),
        ])
        if (productsRes.ok) setProducts(await productsRes.json())
        if (categoriesRes.ok) setCategories(await categoriesRes.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenant])

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    if (!tenant) return
    const token = getAuthToken()
    if (!token) return

    setDeletingId(productId)
    try {
      const res = await fetch(`/api/products/${productId}?subdomain=${tenant.subdomain}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete')
      setProducts((p) => p.filter((x) => x.id !== productId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
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
    return (
      <p className="text-gray-500">Products are only available for e-commerce sites.</p>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your store products</p>
        </div>
        <Button onClick={() => router.push(`${adminBase}/products/new`)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">Add your first product to start selling.</p>
            <Button onClick={() => router.push(`${adminBase}/products/new`)}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square w-full bg-gray-100 relative">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>
                  ${product.price.toFixed(2)}
                  {product.category && <span className="ml-2">· {product.category}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`${adminBase}/products/${product.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <ButtonWithLoader
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    loading={deletingId === product.id}
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </ButtonWithLoader>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
