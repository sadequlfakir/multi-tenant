import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { readOrders, writeOrders, readCustomers, writeCustomers } from '@/lib/storage'
import { Order, OrderItem, CustomerInfo, ShippingInfo, PaymentInfo, Customer } from '@/lib/types'
import { getSupabase } from '@/lib/supabase'

// GET - List all orders for a tenant (tenant from Host or query)
export async function GET(request: NextRequest) {
  try {
    const subdomain = getTenantSubdomainFromRequest(request)

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (request from tenant host or subdomain)' },
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

// POST - Create a new order (tenant from Host or body)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subdomain: bodySubdomain, items, customer, shipping, payment } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (request from tenant host or subdomain in body)' },
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

    // Validate product availability before creating order
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const productIds = items.map((item: OrderItem) => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock, status')
      .in('id', productIds)
      .eq('tenant_id', tenant.id)

    if (productsError) {
      console.error('Failed to validate products:', productsError)
      return NextResponse.json(
        { error: 'Failed to validate products' },
        { status: 500 }
      )
    }

    const productsMap = new Map((products || []).map((p: any) => [p.id, p]))
    const availabilityErrors: string[] = []

    for (const item of items as OrderItem[]) {
      const product = productsMap.get(item.productId)
      if (!product) {
        availabilityErrors.push(`Product "${item.productName}" not found`)
        continue
      }
      if (product.status !== 'active') {
        availabilityErrors.push(`Product "${item.productName}" is not available`)
        continue
      }
      if (product.stock != null && product.stock < item.quantity) {
        availabilityErrors.push(
          `Product "${item.productName}" only has ${product.stock} in stock, but ${item.quantity} requested`
        )
        continue
      }
    }

    if (availabilityErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some products are not available',
          details: availabilityErrors
        },
        { status: 400 }
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
