import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers, readCustomers, writeCustomers } from '@/lib/storage'
import { Customer, Tenant } from '@/lib/types'

async function ensureTenantAccess(
  request: NextRequest,
  subdomain: string | null
): Promise<{ tenant: NonNullable<Tenant>; user: { id: string } } | NextResponse> {
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
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await getAuthenticatedUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!('role' in user)) {
    const users = await readUsers()
    const userData = users.find((u) => u.id === user.id)
    if (userData?.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  return { tenant, user }
}

// GET - Get a single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subdomain = getTenantSubdomainFromRequest(request)
    const access = await ensureTenantAccess(request, subdomain)
    if (access instanceof NextResponse) return access
    const { tenant } = access

    const customers = await readCustomers()
    const customer = customers.find(
      (c) => c.id === id && c.tenantId === tenant.id
    )
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT - Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { subdomain: bodySubdomain, name, email, phone } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain
    const access = await ensureTenantAccess(request, subdomain ?? null)
    if (access instanceof NextResponse) return access
    const { tenant } = access

    const customers = await readCustomers()
    const index = customers.findIndex(
      (c) => c.id === id && c.tenantId === tenant.id
    )
    if (index === -1) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const emailLower = email ? String(email).toLowerCase().trim() : customers[index].email
    const duplicate = customers.some(
      (c) =>
        c.tenantId === tenant.id &&
        c.id !== id &&
        c.email.toLowerCase() === emailLower
    )
    if (duplicate) {
      return NextResponse.json(
        { error: 'Another customer with this email already exists' },
        { status: 400 }
      )
    }

    const updated: Customer = {
      ...customers[index],
      name: name !== undefined ? String(name).trim() : customers[index].name,
      email: email !== undefined ? emailLower : customers[index].email,
      phone: phone !== undefined ? (phone ? String(phone).trim() : undefined) : customers[index].phone,
      updatedAt: new Date().toISOString(),
    }
    customers[index] = updated
    await writeCustomers(customers)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subdomain = getTenantSubdomainFromRequest(request)
    const access = await ensureTenantAccess(request, subdomain)
    if (access instanceof NextResponse) return access
    const { tenant } = access

    const customers = await readCustomers()
    const index = customers.findIndex(
      (c) => c.id === id && c.tenantId === tenant.id
    )
    if (index === -1) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    customers.splice(index, 1)
    await writeCustomers(customers)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
