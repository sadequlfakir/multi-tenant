import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers, readCustomers, writeCustomers } from '@/lib/storage'
import { Customer } from '@/lib/types'

// GET - Tenant from Host or query
export async function GET(request: NextRequest) {
  try {
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

    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find((u) => u.id === user.id)
      const ownsByLegacy = userData?.tenantId === tenant.id
      const ownsByOwner = tenant.ownerUserId === user.id
      if (!ownsByLegacy && !ownsByOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const customers = await readCustomers()
    const tenantCustomers = customers
      .filter((c) => c.tenantId === tenant.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json(tenantCustomers)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subdomain: bodySubdomain, name, email, phone } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant is required (Host or subdomain in body)' },
        { status: 400 }
      )
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
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

    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find((u) => u.id === user.id)
      const ownsByLegacy = userData?.tenantId === tenant.id
      const ownsByOwner = tenant.ownerUserId === user.id
      if (!ownsByLegacy && !ownsByOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const customers = await readCustomers()
    const emailLower = String(email).toLowerCase().trim()
    const exists = customers.some(
      (c) => c.tenantId === tenant.id && c.email.toLowerCase() === emailLower
    )
    if (exists) {
      return NextResponse.json(
        { error: 'A customer with this email already exists for this store' },
        { status: 400 }
      )
    }

    const newCustomer: Customer = {
      id: `customer-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenantId: tenant.id,
      name: String(name).trim(),
      email: emailLower,
      phone: phone ? String(phone).trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    customers.push(newCustomer)
    await writeCustomers(customers)

    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
