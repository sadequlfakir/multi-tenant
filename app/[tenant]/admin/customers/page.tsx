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
import { Customer } from '@/lib/types'
import { getAuthToken } from '@/lib/auth-client'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import { useTenantAdmin } from '../use-tenant-admin'

export default function TenantAdminCustomersPage() {
  const { tenant, loading: tenantLoading, adminBase } = useTenantAdmin()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

  const fetchCustomers = () => {
    if (!tenant || tenant.template !== 'ecommerce') return
    const token = getAuthToken()
    if (!token) return
    fetch(`/api/customers?subdomain=${tenant.subdomain}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!tenant || tenant.template !== 'ecommerce') return
    setLoading(true)
    fetchCustomers()
  }, [tenant])

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
      })
    } else {
      setEditingCustomer(null)
      setFormData({ name: '', email: '', phone: '' })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    const token = getAuthToken()
    if (!token) return
    const name = formData.name.trim()
    const email = formData.email.trim().toLowerCase()
    if (!name || !email) return

    try {
      setSaving(true)
      if (editingCustomer) {
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subdomain: tenant.subdomain,
            name,
            email,
            phone: formData.phone.trim() || undefined,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to update customer')
        }
        const updated = await res.json()
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subdomain: tenant.subdomain,
            name,
            email,
            phone: formData.phone.trim() || undefined,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create customer')
        }
        const created = await res.json()
        setCustomers((prev) => [created, ...prev])
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
    if (!confirm('Delete this customer? This cannot be undone.')) return
    try {
      setDeletingId(id)
      const res = await fetch(`/api/customers/${id}?subdomain=${tenant.subdomain}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      setCustomers((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert('Failed to delete customer')
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
    return <p className="text-gray-500">Customers are only for e-commerce sites.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer accounts</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-600 mb-4">Add a customer or they will appear when they register or place orders.</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)} title="Edit">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    title="Delete"
                  >
                    {deletingId === c.id ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>{c.email}</p>
                {c.phone && <p>{c.phone}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit customer' : 'Add customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Update name, email, or phone.'
                : 'Create a customer. They can also be created when someone places an order.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone (optional)</Label>
              <Input
                id="customer-phone"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <ButtonWithLoader type="submit" loading={saving}>
                {editingCustomer ? 'Save' : 'Add customer'}
              </ButtonWithLoader>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
