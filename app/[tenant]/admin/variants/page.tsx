'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { VariantOptionSet, VariantOptionSchema } from '@/lib/types'
import { getAuthToken } from '@/lib/auth-client'
import { Plus, Edit, Trash2, Layers } from 'lucide-react'
import { useTenantAdmin } from '../use-tenant-admin'

function schemaToForm(schema: VariantOptionSchema[]): { name: string; values: string }[] {
  return schema.map((s) => ({ name: s.name, values: s.values.join(', ') }))
}

function formToSchema(rows: { name: string; values: string }[]): VariantOptionSchema[] {
  return rows
    .map((r) => ({
      name: r.name.trim(),
      values: r.values
        .split(/[,;]/)
        .map((v) => v.trim())
        .filter(Boolean),
    }))
    .filter((r) => r.name && r.values.length > 0)
}

export default function TenantAdminVariantsPage() {
  const { tenant, loading: tenantLoading, adminBase } = useTenantAdmin()
  const [sets, setSets] = useState<VariantOptionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<VariantOptionSet | null>(null)
  const [formName, setFormName] = useState('')
  const [formSchemaRows, setFormSchemaRows] = useState<{ name: string; values: string }[]>([
    { name: '', values: '' },
  ])

  useEffect(() => {
    if (!tenant || tenant.template !== 'ecommerce') return
    fetch(`/api/variant-option-sets?subdomain=${tenant.subdomain}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSets(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tenant])

  const handleOpenDialog = (set?: VariantOptionSet) => {
    if (set) {
      setEditingSet(set)
      setFormName(set.name)
      const rows = schemaToForm(set.schema || [])
      setFormSchemaRows(rows.length ? rows : [{ name: '', values: '' }])
    } else {
      setEditingSet(null)
      setFormName('')
      setFormSchemaRows([{ name: '', values: '' }])
    }
    setIsDialogOpen(true)
  }

  const addSchemaRow = () => {
    setFormSchemaRows((p) => [...p, { name: '', values: '' }])
  }

  const updateSchemaRow = (index: number, field: 'name' | 'values', value: string) => {
    setFormSchemaRows((p) =>
      p.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const removeSchemaRow = (index: number) => {
    setFormSchemaRows((p) => (p.length <= 1 ? [{ name: '', values: '' }] : p.filter((_, i) => i !== index)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    const token = getAuthToken()
    if (!token) return
    const name = formName.trim()
    if (!name) return
    const schema = formToSchema(formSchemaRows)
    if (schema.length === 0) {
      alert('Add at least one option (e.g. Color with values Red, Blue)')
      return
    }

    try {
      setSaving(true)
      if (editingSet) {
        const res = await fetch(`/api/variant-option-sets/${editingSet.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subdomain: tenant.subdomain, name, schema }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to update')
        }
        const updated = await res.json()
        setSets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      } else {
        const res = await fetch('/api/variant-option-sets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subdomain: tenant.subdomain, name, schema }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create')
        }
        const created = await res.json()
        setSets((prev) => [created, ...prev])
      }
      setIsDialogOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!tenant) return
    const token = getAuthToken()
    if (!token) return
    if (!confirm('Delete this variant set? Products using it will keep their variants but this set will be removed.')) return
    try {
      setDeletingId(id)
      const res = await fetch(`/api/variant-option-sets/${id}?subdomain=${tenant.subdomain}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      setSets((prev) => prev.filter((s) => s.id !== id))
    } catch {
      alert('Failed to delete variant set')
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
    return <p className="text-gray-500">Variant option sets are only for e-commerce sites.</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Variant option sets</h1>
          <p className="text-sm text-gray-500 mt-1">Reusable options (e.g. Color, Size) for product variants</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add variant set
        </Button>
      </div>

      {sets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No variant sets yet</h3>
            <p className="text-gray-600 mb-4">Create sets like &quot;Color&quot; or &quot;Size&quot; and attach them when creating products.</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add variant set
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sets.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(s)} title="Edit">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    title="Delete"
                  >
                    {deletingId === s.id ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                {(s.schema || []).map((opt, i) => (
                  <p key={i}>
                    <span className="font-medium">{opt.name}:</span>{' '}
                    {opt.values.join(', ')}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSet ? 'Edit variant set' : 'Add variant set'}</DialogTitle>
            <DialogDescription>
              Define options like Color (Red, Blue) or Size (S, M, L). Use these when creating products.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="variant-set-name">Set name</Label>
              <Input
                id="variant-set-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. T-shirt options"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Options (e.g. Color, Size)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSchemaRow}>
                  <Plus className="w-3 h-3 mr-1" /> Add option
                </Button>
              </div>
              <div className="space-y-3">
                {formSchemaRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="Option name (e.g. Color)"
                      value={row.name}
                      onChange={(e) => updateSchemaRow(i, 'name', e.target.value)}
                      className="w-32 shrink-0"
                    />
                    <Input
                      placeholder="Values: Red, Blue, Green"
                      value={row.values}
                      onChange={(e) => updateSchemaRow(i, 'values', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSchemaRow(i)}
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Separate values with commas.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <ButtonWithLoader type="submit" loading={saving}>
                {editingSet ? 'Save' : 'Add variant set'}
              </ButtonWithLoader>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
