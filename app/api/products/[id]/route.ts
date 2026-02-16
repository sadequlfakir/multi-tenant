import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { Product } from '@/lib/types'
import { isCloudinaryUrl, deleteByUrl } from '@/lib/cloudinary'
import { getSupabase } from '@/lib/supabase'
import { mapProductRow, mapVariantRow } from '@/lib/product-api-mapper'
import { generateSlug, ensureUniqueSlug } from '@/lib/slug-utils'

// GET - Tenant from Host or query. Storefront gets only active; dashboard gets any status.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subdomain = getTenantSubdomainFromRequest(request)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const isDashboard = Boolean(token && (await getAuthenticatedUser(token)))

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (request must be from tenant host or include subdomain)' },
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

    const supabase = getSupabase()
    if (!supabase) {
      console.error('GET /api/products/[id]: Supabase is not configured')
      return NextResponse.json(
        { error: 'Supabase is not configured on the server' },
        { status: 500 }
      )
    }

    // Support both UUID (id) and slug lookups
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenant.id)
    
    if (isUUID) {
      query = query.eq('id', id)
    } else {
      query = query.eq('slug', id)
    }
    
    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('GET /api/products/[id] (supabase):', error)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    if (!isDashboard && (data.status ?? 'active') !== 'active') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const productMapped = mapProductRow(data as Record<string, unknown>)
    const { data: variantsData } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: true })
    const variants = (variantsData ?? []).map((v) => mapVariantRow(v as Record<string, unknown>))
    const result: Product = { ...productMapped, variants }
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subdomain: bodySubdomain, ...productData } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (Host or subdomain in body)' },
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

    // Check if user owns this tenant
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error('PUT /api/products/[id]: Supabase is not configured')
      return NextResponse.json(
        { error: 'Supabase is not configured on the server' },
        { status: 500 }
      )
    }

    // Load existing product to handle image cleanup and SEO keyword merge if needed
    const { data: existing, error: loadError } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single()

    if (loadError) {
      if (loadError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('PUT /api/products/[id] (load existing):', loadError)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    const oldImage = (existing as any).image as string | null
    const newImage = productData.image as string | undefined
    if (oldImage && newImage && newImage !== oldImage && isCloudinaryUrl(oldImage)) {
      await deleteByUrl(oldImage)
    }

    // Normalize SEO keywords if passed as string
    let seoKeywords: unknown = (existing as any).seo_keywords
    if (productData.seoKeywords !== undefined) {
      seoKeywords = Array.isArray(productData.seoKeywords)
        ? productData.seoKeywords
        : typeof productData.seoKeywords === 'string'
          ? productData.seoKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : undefined
    }

    // Handle slug generation
    let slug: string | null = (existing as any).slug
    if (productData.slug !== undefined) {
      if (productData.slug === '' || productData.slug === null) {
        // Auto-generate from name if slug is cleared
        const productName = productData.name ?? (existing as any).name
        slug = generateSlug(productName)
      } else {
        slug = generateSlug(productData.slug)
      }
    } else if (productData.name && !slug) {
      // Auto-generate slug if name changed and no slug exists
      slug = generateSlug(productData.name)
    }

    // Ensure slug uniqueness
    if (slug) {
      const { data: existingProducts } = await supabase
        .from('products')
        .select('slug')
        .eq('tenant_id', tenant.id)
        .neq('id', id)
      
      const existingSlugs = (existingProducts || [])
        .map((p: any) => p.slug)
        .filter(Boolean)
      
      slug = ensureUniqueSlug(slug, existingSlugs, (existing as any).slug)
    }

    const updatePayload: Record<string, unknown> = {
      name: productData.name ?? (existing as any).name,
      description: productData.description ?? (existing as any).description,
      price: productData.price ?? (existing as any).price,
      image: newImage ?? oldImage,
      category: productData.category ?? (existing as any).category,
      stock: productData.stock ?? (existing as any).stock,
      sku: productData.sku ?? (existing as any).sku,
      slug: slug ?? null,
      featured: productData.featured ?? (existing as any).featured,
      status: productData.status ?? (existing as any).status,
      seo_title: productData.seoTitle ?? (existing as any).seo_title,
      seo_description: productData.seoDescription ?? (existing as any).seo_description,
      seo_keywords: seoKeywords ?? null,
      variant_schema: productData.variantSchema !== undefined ? productData.variantSchema : (existing as any).variant_schema,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('PUT /api/products/[id] (supabase update):', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    const variantsPayload = productData.variants as Array<{ options: Record<string, string>; sku?: string; priceAdjustment?: number; stock?: number }> | undefined
    if (variantsPayload !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', id)
      for (const v of variantsPayload) {
        await supabase.from('product_variants').insert({
          product_id: id,
          options: v.options ?? {},
          sku: v.sku ?? null,
          price_adjustment: v.priceAdjustment ?? 0,
          stock: v.stock ?? null,
        })
      }
    }

    const productMapped = mapProductRow(data as Record<string, unknown>)
    const { data: variantsData } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: true })
    const variants = (variantsData ?? []).map((v) => mapVariantRow(v as Record<string, unknown>))
    return NextResponse.json({ ...productMapped, variants } as Product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subdomain = getTenantSubdomainFromRequest(request)

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (Host or subdomain in query)' },
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

    // Check if user owns this tenant
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error('DELETE /api/products/[id]: Supabase is not configured')
      return NextResponse.json(
        { error: 'Supabase is not configured on the server' },
        { status: 500 }
      )
    }

    // Load product to delete associated Cloudinary image if needed
    const { data: existing, error: loadError } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single()

    if (loadError) {
      if (loadError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('DELETE /api/products/[id] (load existing):', loadError)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    const image = (existing as any).image as string | null
    if (image && isCloudinaryUrl(image)) {
      await deleteByUrl(image)
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', id)

    if (error) {
      console.error('DELETE /api/products/[id] (supabase delete):', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
