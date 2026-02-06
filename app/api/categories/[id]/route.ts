import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig } from '@/lib/tenant-store'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { Category } from '@/lib/types'
import { isCloudinaryUrl, deleteByUrl } from '@/lib/cloudinary'

// GET - Tenant from Host or query
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const categories = tenant.config.categories || []
    const category = categories.find(c => c.id === id)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT - Update a category
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
    const { subdomain: bodySubdomain, ...categoryData } = body
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

    const categories = tenant.config.categories || []
    const categoryIndex = categories.findIndex(c => c.id === id)

    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const oldImage = categories[categoryIndex].image
    const newImage = categoryData.image
    if (oldImage && newImage !== oldImage && isCloudinaryUrl(oldImage)) {
      await deleteByUrl(oldImage)
    }

    // Generate slug if name changed
    let slug = categoryData.slug || categories[categoryIndex].slug
    if (categoryData.name && categoryData.name !== categories[categoryIndex].name) {
      slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      // Check if slug already exists (excluding current category)
      const existingCategory = categories.find(c => c.slug === slug && c.id !== id)
      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update category
    const updatedCategory: Category = {
      ...categories[categoryIndex],
      ...categoryData,
      id, // Ensure ID doesn't change
      slug,
      updatedAt: new Date().toISOString(),
    }

    categories[categoryIndex] = updatedCategory

    const updatedTenant = await updateTenantConfig(subdomain, {
      categories,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedCategory)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a category
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

    const categories = tenant.config.categories || []
    
    // Check if category has products
    const products = tenant.config.products || []
    const productsInCategory = products.filter(p => p.category === categories.find(c => c.id === id)?.name)
    
    if (productsInCategory.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. ${productsInCategory.length} product(s) are using this category.` },
        { status: 400 }
      )
    }

    // Check if category has subcategories
    const subcategories = categories.filter(c => c.parentId === id)
    if (subcategories.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It has ${subcategories.length} subcategory(ies).` },
        { status: 400 }
      )
    }

    const category = categories.find(c => c.id === id)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category.image && isCloudinaryUrl(category.image)) {
      await deleteByUrl(category.image)
    }

    const filteredCategories = categories.filter(c => c.id !== id)
    const updatedTenant = await updateTenantConfig(subdomain, {
      categories: filteredCategories,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
