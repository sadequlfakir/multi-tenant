'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Order } from '@/lib/types'
import { getAuthToken } from '@/lib/auth-client'
import { Package, Eye, Calendar, DollarSign, User, MapPin } from 'lucide-react'
import { useTenantAdmin } from '../use-tenant-admin'

export default function TenantAdminOrdersPage() {
  const { tenant, loading: tenantLoading, adminBase } = useTenantAdmin()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<Order['status'] | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!tenant || tenant.template !== 'ecommerce') return
    const token = getAuthToken()
    if (!token) return
    fetch(`/api/orders?subdomain=${tenant.subdomain}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tenant])

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    if (!tenant) return
    const token = getAuthToken()
    if (!token) return
    setUpdatingOrderId(orderId)
    setUpdatingStatus(newStatus)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subdomain: tenant.subdomain, status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update')
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setUpdatingOrderId(null)
      setUpdatingStatus(null)
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
    return <p className="text-gray-500">Orders are only for e-commerce sites.</p>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage customer orders</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Orders will appear here when customers place them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${order.total.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {order.items.length} item(s)
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold mb-1 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Customer
                    </p>
                    <p className="text-gray-600">{order.customer.name}</p>
                    <p className="text-gray-500 text-xs">{order.customer.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Shipping
                    </p>
                    <p className="text-gray-600">
                      {order.shipping.city}, {order.shipping.zipCode}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Update status</p>
                    <div className="flex gap-2 flex-wrap">
                      {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(
                        (status) => (
                          <ButtonWithLoader
                            key={status}
                            variant={order.status === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, status)}
                            disabled={order.status === status}
                            loading={updatingOrderId === order.id && updatingStatus === status}
                            loadingLabel="..."
                            className="text-xs"
                          >
                            {status}
                          </ButtonWithLoader>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>Order details and customer information</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-bold">${item.subtotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Customer</h3>
                <p>{selectedOrder.customer.name}</p>
                <p className="text-gray-600">{selectedOrder.customer.email}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Shipping</h3>
                <p className="text-gray-600">
                  {selectedOrder.shipping.address}, {selectedOrder.shipping.city},{' '}
                  {selectedOrder.shipping.zipCode}
                </p>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
