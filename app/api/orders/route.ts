import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { readOrders, writeOrders, readCustomers, writeCustomers } from '@/lib/storage'
import { Order, OrderItem, CustomerInfo, ShippingInfo, PaymentInfo, Customer } from '@/lib/types'

// GET - List all orders for a tenant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      )
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant || tenant.template !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Tenant not found or not an e-commerce site' },
        { status: 404 }
      )
    }

    const orders = await readOrders()
    const tenantOrders = orders.filter(o => o.tenantId === tenant.id)
    
    // Sort by created date (newest first)
    tenantOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(tenantOrders)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subdomain, items, customer, shipping, payment } = body

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!customer || !customer.name || !customer.email) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      )
    }

    if (!shipping || !shipping.address || !shipping.city || !shipping.zipCode) {
      return NextResponse.json(
        { error: 'Shipping information is required' },
        { status: 400 }
      )
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant || tenant.template !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Tenant not found or not an e-commerce site' },
        { status: 404 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: OrderItem) => sum + item.subtotal, 0)
    const shippingCost = shipping.shippingCost || 0
    const tax = subtotal * 0.1 // 10% tax (can be configurable)
    const total = subtotal + shippingCost + tax

    // Load existing data
    const orders = await readOrders()
    const customers = await readCustomers()

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create / update customer from email
    const existingCustomerIndex = customers.findIndex(
      (c) => c.tenantId === tenant.id && c.email.toLowerCase() === (customer as CustomerInfo).email.toLowerCase()
    )

    let customerId: string

    if (existingCustomerIndex === -1) {
      // New customer for this tenant
      const newCustomer: Customer = {
        id: `customer-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        tenantId: tenant.id,
        name: (customer as CustomerInfo).name,
        email: (customer as CustomerInfo).email.toLowerCase(),
        phone: (customer as CustomerInfo).phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      customers.push(newCustomer)
      customerId = newCustomer.id
    } else {
      // Update existing customer basic info
      const existing = customers[existingCustomerIndex]
      const updated: Customer = {
        ...existing,
        name: (customer as CustomerInfo).name || existing.name,
        phone: (customer as CustomerInfo).phone || existing.phone,
        updatedAt: new Date().toISOString(),
      }
      customers[existingCustomerIndex] = updated
      customerId = updated.id
    }

    // Persist customers list
    await writeCustomers(customers)

    // Create order
    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenantId: tenant.id,
      orderNumber,
      items: items as OrderItem[],
      customer: customer as CustomerInfo,
      shipping: shipping as ShippingInfo,
      payment: payment as PaymentInfo || { method: 'other' },
      status: 'pending',
      subtotal,
      shippingCost,
      tax,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    orders.push(newOrder)
    await writeOrders(orders)

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
