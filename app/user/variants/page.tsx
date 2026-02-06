'use client'

import { useEffect, useState } from 'react'
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
import { Tenant, VariantOptionSet, VariantOptionSchema } from '@/lib/types'
import { Plus, Edit, Trash2, Layers } from 'lucide-react'

/** Form state: values as raw string so user can type commas freely */
type FormOption = { name: string; valuesStr: string }

export default function VariantsManagementPage() {
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [variantSets, setVariantSets] = useState<VariantOptionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<VariantOptionSet | null>(null)
  const [name, setName] = useState('')
  const [schema, setSchema] = useState<FormOption[]>([])

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
          const res = await fetch(
            `/api/variant-option-sets?subdomain=${userTenant.subdomain}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (res.ok) {
            const data = await res.json()
            setVariantSets(data)
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

  const handleOpenDialog = (set?: VariantOptionSet) => {
    if (set) {
      setEditingSet(set)
      setName(set.name)
      setSchema(
        set.schema?.length
          ? set.schema.map((o) => ({
              name: o.name,
              valuesStr: Array.isArray(o.values) ? o.values.join(', ') : '',
            }))
          : []
      )
    } else {
      setEditingSet(null)
      setName('')
      setSchema([])
    }
    setIsDialogOpen(true)
  }

  const addOption = () => {
    setSchema((s) => [...s, { name: '', valuesStr: '' }])
  }

  const updateOption = (idx: number, field: 'name' | 'valuesStr', value: string) => {
    setSchema((s) => {
      const next = [...s]
      if (field === 'name') next[idx] = { ...next[idx], name: value }
      else next[idx] = { ...next[idx], valuesStr: value }
      return next
    })
  }

  const removeOption = (idx: number) => {
    setSchema((s) => s.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    const token = localStorage.getItem('userToken')
    if (!token) return

    const normalizedSchema: VariantOptionSchema[] = schema
      .map((s) => ({
        name: s.name.trim(),
        values: s.valuesStr
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((s) => s.name && s.values.length > 0)

    if (!name.trim()) {
      alert('Name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        subdomain: tenant.subdomain,
        name: name.trim(),
        schema: normalizedSchema,
      }
      if (editingSet) {
        const res = await fetch(`/api/variant-option-sets/${editingSet.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to update')
        }
      } else {
        const res = await fetch('/api/variant-option-sets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create')
        }
      }
      setIsDialogOpen(false)
      loadData(token)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant set? Products using it will keep their current variant data but the set will no longer be selectable.')) return
    if (!tenant) return
    const token = localStorage.getItem('userToken')
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(
        `/api/variant-option-sets/${id}?subdomain=${tenant.subdomain}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete')
      }
      loadData(token)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading variants...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Variants</h1>
              <p className="text-sm text-gray-500 mt-1">
                Create variant option sets (e.g. Color, Size) to use on products
              </p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Variant Set
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {variantSets.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Variant Sets Yet</h3>
              <p className="text-gray-600 mb-6">
                Create variant sets (e.g. &quot;T-shirt options&quot; with Color and Size) and assign them to products to sell by color, size, etc.
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Variant Set
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {variantSets.map((set) => (
              <Card key={set.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{set.name}</CardTitle>
                  <CardDescription>
                    {set.schema?.length
                      ? set.schema.map((o) => `${o.name}: ${o.values?.join(', ') ?? ''}`).join(' · ')
                      : 'No options'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(set)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <ButtonWithLoader
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      loading={deletingId === set.id}
                      onClick={() => handleDelete(set.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </ButtonWithLoader>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSet ? 'Edit Variant Set' : 'Add Variant Set'}</DialogTitle>
            <DialogDescription>
              Define option names and values (e.g. Color: Red, Blue; Size: S, M, L). Use this set on products to fill SKU, price, and stock per variant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="vos-name">Name *</Label>
              <Input
                id="vos-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. T-shirt options"
                required
              />
            </div>
            <div>
              <Label className="mb-2 block">Options (name + values)</Label>
              {schema.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <Input
                    placeholder="Option (e.g. Color)"
                    value={opt.name}
                    onChange={(e) => updateOption(idx, 'name', e.target.value)}
                    className="w-28"
                  />
                  <Input
                    placeholder="Values, comma-separated (e.g. Red, Blue)"
                    value={opt.valuesStr}
                    onChange={(e) => updateOption(idx, 'valuesStr', e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => removeOption(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                Add option
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <ButtonWithLoader
                type="submit"
                loading={saving}
                loadingLabel={editingSet ? 'Updating...' : 'Creating...'}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {editingSet ? 'Update' : 'Create'}
              </ButtonWithLoader>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
