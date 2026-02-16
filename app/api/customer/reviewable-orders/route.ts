import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readOrders } from '@/lib/storage'

// GET - Get delivered orders for the authenticated customer (for review purposes)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const result = await getAuthenticatedCustomer(token)
    
    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get product ID from query if provided
    const productId = request.nextUrl.searchParams.get('productId')

    // Get all delivered orders for this customer
    const orders = await readOrders()
    const deliveredOrders = orders.filter(
      order => 
        order.tenantId === result.account.tenantId &&
        order.customer.email.toLowerCase() === result.customer.email.toLowerCase() &&
        order.status === 'delivered'
    )

    // If productId is provided, filter orders that contain this product
    let filteredOrders = deliveredOrders
    if (productId) {
      filteredOrders = deliveredOrders.filter(order =>
        order.items.some(item => item.productId === productId)
      )
    }

    // Return orders with product information
    const ordersWithProducts = filteredOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
      })),
    }))

    return NextResponse.json(ordersWithProducts)
  } catch (error) {
    console.error('Failed to fetch reviewable orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
