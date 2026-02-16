import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readOrders } from '@/lib/storage'
import type { Order } from '@/lib/types'

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

    // Get status filter from query params
    const statusFilter = request.nextUrl.searchParams.get('status')

    // Get all orders for the tenant
    const orders = await readOrders()
    
    // Filter orders by customer email and tenant
    const customerOrders = orders.filter(
      order => 
        order.tenantId === result.account.tenantId &&
        order.customer.email.toLowerCase() === result.customer.email.toLowerCase()
    )

    // Apply status filter if provided
    let filteredOrders = customerOrders
    if (statusFilter && statusFilter !== 'all') {
      filteredOrders = customerOrders.filter(order => order.status === statusFilter)
    }

    // Sort by created date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(filteredOrders)
  } catch (error) {
    console.error('Failed to fetch customer orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
