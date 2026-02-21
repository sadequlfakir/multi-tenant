import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedCustomer } from '@/lib/auth'
import { readCustomerWishlist, writeCustomerWishlist, deleteCustomerWishlistItem } from '@/lib/storage'
import type { CustomerWishlistItem } from '@/lib/types'
import { getSupabase } from '@/lib/supabase'

// GET - List all wishlist items for the authenticated customer
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

    const wishlistItems = await readCustomerWishlist()
    const customerWishlist = wishlistItems.filter(
      item => item.customerId === result.customer.id && item.tenantId === result.account.tenantId
    )

    // Fetch product details with availability
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const productIds = customerWishlist.map(item => item.productId)
    if (productIds.length === 0) {
      return NextResponse.json([])
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, price, image, stock, status, slug')
      .in('id', productIds)
      .eq('tenant_id', result.account.tenantId)

    if (productsError) {
      console.error('Failed to fetch wishlist products:', productsError)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Map products with availability info
    const productsMap = new Map((products || []).map((p: any) => [p.id, p]))
    const wishlistWithProducts = customerWishlist
      .map(item => {
        const product = productsMap.get(item.productId)
        if (!product) return null
        return {
          ...item,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            stock: product.stock,
            status: product.status,
            slug: product.slug,
            isAvailable: product.status === 'active' && (product.stock == null || product.stock > 0),
          },
        }
      })
      .filter(Boolean)

    // Sort by created date (newest first)
    wishlistWithProducts.sort((a, b) => 
      new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
    )

    return NextResponse.json(wishlistWithProducts)
  } catch (error) {
    console.error('Failed to fetch wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

// POST - Add a product to wishlist
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { productId } = body

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Verify product exists and belongs to tenant
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('tenant_id', result.account.tenantId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if already in wishlist
    const wishlistItems = await readCustomerWishlist()
    const existing = wishlistItems.find(
      item => item.customerId === result.customer.id && 
              item.tenantId === result.account.tenantId && 
              item.productId === productId
    )

    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    const newItem: CustomerWishlistItem = {
      id: `wishlist-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      customerId: result.customer.id,
      tenantId: result.account.tenantId,
      productId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const allItems = await readCustomerWishlist()
    allItems.push(newItem)
    await writeCustomerWishlist(allItems)

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error('Failed to add to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a product from wishlist
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const wishlistItems = await readCustomerWishlist()
    const item = wishlistItems.find(
      item => item.customerId === result.customer.id && 
              item.tenantId === result.account.tenantId && 
              item.productId === productId
    )

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in wishlist' },
        { status: 404 }
      )
    }

    await deleteCustomerWishlistItem(item.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    )
  }
}
