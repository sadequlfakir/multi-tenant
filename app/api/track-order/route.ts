import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { readOrders } from '@/lib/storage'

// Public API: track order by order number + email (no auth). Tenant from Host or query.
export async function GET(request: NextRequest) {
  try {
    const subdomain = getTenantSubdomainFromRequest(request)
    const orderNumber = request.nextUrl.searchParams.get('orderNumber')
    const email = request.nextUrl.searchParams.get('email')

    if (!subdomain || !orderNumber || !email) {
      return NextResponse.json(
        { error: 'Store (tenant), order number, and email are required' },
        { status: 400 }
      )
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant || tenant.template !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    const orders = await readOrders()
    const order = orders.find(
      (o) =>
        o.tenantId === tenant.id &&
        String(o.orderNumber).toUpperCase() === String(orderNumber).toUpperCase().trim()
    )

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found. Check your order number and email.' },
        { status: 404 }
      )
    }

    const emailMatch =
      order.customer?.email &&
      String(order.customer.email).toLowerCase().trim() === String(email).toLowerCase().trim()
    if (!emailMatch) {
      return NextResponse.json(
        { error: 'Order not found. Check your order number and email.' },
        { status: 404 }
      )
    }

    // Return only fields needed for tracking (status, timeline, items summary)
    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      total: order.total,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      tax: order.tax,
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      shipping: order.shipping
        ? {
            address: order.shipping.address,
            city: order.shipping.city,
            state: order.shipping.state,
            zipCode: order.shipping.zipCode,
            country: order.shipping.country,
          }
        : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to look up order' },
      { status: 500 }
    )
  }
}
