'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tenant, Order, CustomerAddress } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { getProductLink } from '@/lib/product-link-utils'
import { useCart } from '@/lib/cart-context'
import Link from 'next/link'
import { EcommerceHeader } from '@/components/ecommerce-header'
import { CustomerSidebar } from '@/components/customer-sidebar'
import { Package, MapPin, Plus, Edit, Trash2, Save, Heart, ShoppingCart, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ButtonWithLoader } from '@/components/ui/button-with-loader'

interface CustomerDashboardProps {
  tenant: Tenant
}

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type DashboardSection = 'orders' | 'wishlist' | 'addresses' | 'profile' | 'password'

interface WishlistItemWithProduct {
  id: string
  productId: string
  product?: {
    id: string
    name: string
    description: string
    price: number
    image: string
    stock?: number
    status?: string
    slug?: string
    isAvailable: boolean
  }
}

export default function CustomerDashboard({ tenant }: CustomerDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToCart } = useCart()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithProduct[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<DashboardSection>('orders')
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all')
  
  // Address form state
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [addressForm, setAddressForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    isDefault: false,
  })
  const [savingAddress, setSavingAddress] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const sectionParam = searchParams.get('section')
  useEffect(() => {
    if (sectionParam === 'wishlist' && activeSection !== 'wishlist') {
      setActiveSection('wishlist')
    }
  }, [sectionParam])

  useEffect(() => {
    if (customer) {
      if (activeSection === 'orders') {
        loadOrders()
      } else if (activeSection === 'wishlist') {
        loadWishlist()
      } else if (activeSection === 'addresses') {
        loadAddresses()
      } else if (activeSection === 'profile') {
        loadProfile()
      }
    }
  }, [customer, activeSection, statusFilter])

  const checkAuth = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) {
      router.push(getTenantLink(tenant, '/customer/login'))
      return
    }

    try {
      const response = await fetch('/api/customer/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        localStorage.removeItem('customerToken')
        localStorage.removeItem('customerTenantId')
        router.push(getTenantLink(tenant, '/customer/login'))
        return
      }

      const data = await response.json()
      setCustomer(data)
    } catch (error) {
      console.error('Failed to check auth:', error)
      localStorage.removeItem('customerToken')
      localStorage.removeItem('customerTenantId')
      router.push(getTenantLink(tenant, '/customer/login'))
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const url = `/api/customer/orders${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }

  const loadWishlist = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    setWishlistLoading(true)
    try {
      const response = await fetch('/api/customer/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWishlistItems(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error)
    } finally {
      setWishlistLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const res = await fetch(`/api/customer/wishlist?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) loadWishlist()
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    }
  }

  const loadAddresses = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const response = await fetch('/api/customer/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAddresses(data)
      }
    } catch (error) {
      console.error('Failed to load addresses:', error)
    }
  }

  const loadProfile = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const response = await fetch('/api/customer/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerTenantId')
    router.push(getTenantLink(tenant, '/'))
  }

  const openAddressDialog = (address?: CustomerAddress) => {
    if (address) {
      setEditingAddress(address)
      setAddressForm({
        name: address.name,
        address: address.address,
        city: address.city,
        state: address.state || '',
        zipCode: address.zipCode,
        country: address.country || '',
        phone: address.phone || '',
        isDefault: address.isDefault,
      })
    } else {
      setEditingAddress(null)
      setAddressForm({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: '',
        isDefault: false,
      })
    }
    setShowAddressDialog(true)
  }

  const saveAddress = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    setSavingAddress(true)
    try {
      const url = editingAddress
        ? `/api/customer/addresses/${editingAddress.id}`
        : '/api/customer/addresses'
      
      const method = editingAddress ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      })

      if (response.ok) {
        setShowAddressDialog(false)
        loadAddresses()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save address')
      }
    } catch (error) {
      console.error('Failed to save address:', error)
      alert('Failed to save address')
    } finally {
      setSavingAddress(false)
    }
  }

  const deleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    const token = localStorage.getItem('customerToken')
    if (!token) return

    try {
      const response = await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        loadAddresses()
      } else {
        alert('Failed to delete address')
      }
    } catch (error) {
      console.error('Failed to delete address:', error)
      alert('Failed to delete address')
    }
  }

  const saveProfile = async () => {
    const token = localStorage.getItem('customerToken')
    if (!token) return

    setSavingProfile(true)
    try {
      const response = await fetch('/api/customer/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCustomer({ ...customer, name: data.name, phone: data.phone })
        setEditingProfile(false)
        alert('Profile updated successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    const token = localStorage.getItem('customerToken')
    if (!token) return

    setSavingPassword(true)
    setPasswordError('')
    try {
      const response = await fetch('/api/customer/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        alert('Password changed successfully')
      } else {
        const data = await response.json()
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Failed to change password:', error)
      setPasswordError('Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <EcommerceHeader tenant={tenant} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />
      <CustomerSidebar
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section as DashboardSection)}
        onLogout={handleLogout}
        customerName={customer.name}
      />
      
      <div className="lg:pl-64 pt-4">
        <div className="container mx-auto px-4 py-8">
          {/* Orders Section */}
          {activeSection === 'orders' && (
            <Card>
              <CardHeader>
                <CardTitle>My Orders</CardTitle>
                <CardDescription>View and track your order status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">
                                Placed on {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-12 h-12 rounded object-cover shrink-0 border border-border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-muted shrink-0 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium">{item.productName}</span>
                                  <span className="text-sm text-muted-foreground"> × {item.quantity}</span>
                                </div>
                                <span className="text-sm font-medium shrink-0">${item.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t pt-4 flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              <p>Shipping: {order.shipping.address}, {order.shipping.city}, {order.shipping.zipCode}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wishlist Section */}
          {activeSection === 'wishlist' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Wishlist
                </CardTitle>
                <CardDescription>Your saved products. Login required to add items.</CardDescription>
              </CardHeader>
              <CardContent>
                {wishlistLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading wishlist...</div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your wishlist is empty</p>
                    <p className="text-sm mt-2">Add products from the store by clicking the heart on product pages.</p>
                    <Link href={getTenantLink(tenant, '/products')}>
                      <Button className="mt-4">Browse Products</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {wishlistItems.map((item) => {
                      const product = item.product
                      if (!product) return null
                      const isAvailable = product.isAvailable
                      const stockStatus =
                        product.stock != null
                          ? product.stock === 0
                            ? 'Out of Stock'
                            : product.stock < 5
                              ? `Only ${product.stock} left`
                              : 'In Stock'
                          : 'In Stock'
                      return (
                        <Card key={item.id} className="overflow-hidden flex flex-col">
                          <div className="h-36 bg-muted relative shrink-0">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                            {!isAvailable && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  <AlertCircle className="w-3 h-3 mr-0.5" />
                                  Unavailable
                                </Badge>
                              </div>
                            )}
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute top-1 right-1 h-7 w-7 rounded-full bg-background/95 hover:bg-destructive hover:text-destructive-foreground border-0 shadow-sm"
                              onClick={() => removeFromWishlist(product.id)}
                              aria-label="Remove from wishlist"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </Button>
                          </div>
                          <div className="p-2.5 flex flex-col flex-1 min-h-0">
                            <Link
                              href={getProductLink(tenant, { id: product.id, slug: product.slug } as any)}
                              className="text-sm font-medium leading-tight line-clamp-2 hover:underline mb-1"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center justify-between gap-1 flex-wrap mb-2">
                              <span className="text-sm font-semibold text-foreground">${product.price}</span>
                              {isAvailable ? (
                                <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                                  {stockStatus}
                                </span>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  {product.status === 'draft' ? 'Draft' : 'Out'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1.5 mt-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs px-2 min-w-0"
                                onClick={() =>
                                  addToCart(
                                    {
                                      id: product.id,
                                      name: product.name,
                                      image: product.image,
                                      price: product.price,
                                      description: product.description,
                                      stock: product.stock,
                                    },
                                    1
                                  )
                                }
                                disabled={!isAvailable}
                              >
                                <ShoppingCart className="w-3 h-3 mr-1 shrink-0" />
                                <span className="truncate">{isAvailable ? 'Cart' : '—'}</span>
                              </Button>
                              <Link href={getProductLink(tenant, { id: product.id, slug: product.slug } as any)} className="shrink-0">
                                <Button size="sm" variant="secondary" className="h-7 text-xs px-2">
                                  Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Addresses Section */}
          {activeSection === 'addresses' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Address Book</CardTitle>
                    <CardDescription>Manage your shipping addresses</CardDescription>
                  </div>
                  <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openAddressDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                        <DialogDescription>
                          {editingAddress ? 'Update your address information' : 'Add a new shipping address'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="name">Address Label</Label>
                          <Input
                            id="name"
                            value={addressForm.name}
                            onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                            placeholder="Home, Work, etc."
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            value={addressForm.address}
                            onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                            placeholder="123 Main St"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              placeholder="City"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipCode">Zip Code</Label>
                            <Input
                              id="zipCode"
                              value={addressForm.zipCode}
                              onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                              placeholder="12345"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              placeholder="State"
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={addressForm.country}
                              onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                              placeholder="Country"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            placeholder="+1234567890"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="isDefault" className="cursor-pointer">
                            Set as default address
                          </Label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowAddressDialog(false)}>
                            Cancel
                          </Button>
                          <ButtonWithLoader onClick={saveAddress} loading={savingAddress}>
                            {editingAddress ? 'Update' : 'Add'} Address
                          </ButtonWithLoader>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No addresses saved</p>
                    <p className="text-sm mt-2">Add your first address to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <Card key={address.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold flex items-center gap-2">
                                {address.name}
                                {address.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </h3>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAddressDialog(address)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAddress(address.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.address}<br />
                            {address.city}, {address.state} {address.zipCode}<br />
                            {address.country && <>{address.country}<br /></>}
                            {address.phone && <>Phone: {address.phone}</>}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>Manage your personal information</CardDescription>
                  </div>
                  {!editingProfile && (
                    <Button onClick={() => setEditingProfile(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      disabled={!editingProfile}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <Label htmlFor="profile-phone">Phone</Label>
                    <Input
                      id="profile-phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      disabled={!editingProfile}
                      placeholder="+1234567890"
                    />
                  </div>
                  {editingProfile && (
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => {
                        setEditingProfile(false)
                        loadProfile()
                      }}>
                        Cancel
                      </Button>
                      <ButtonWithLoader onClick={saveProfile} loading={savingProfile}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </ButtonWithLoader>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Password Section */}
          {activeSection === 'password' && (
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        setPasswordError('')
                      }}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        setPasswordError('')
                      }}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {passwordError}
                    </div>
                  )}
                  <div className="pt-4">
                    <ButtonWithLoader onClick={changePassword} loading={savingPassword}>
                      <Save className="w-4 h-4 mr-2" />
                      Change Password
                    </ButtonWithLoader>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
