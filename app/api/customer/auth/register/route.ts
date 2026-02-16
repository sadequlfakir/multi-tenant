import { NextRequest, NextResponse } from 'next/server'
import { getTenantSubdomainFromRequest } from '@/lib/api-tenant'
import { getTenantBySubdomain } from '@/lib/tenant-store'
import { readCustomers, writeCustomers, readCustomerAccounts, writeCustomerAccounts } from '@/lib/storage'
import { hashPassword } from '@/lib/password'
import type { Customer, CustomerAccount } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, subdomain: bodySubdomain } = body
    const subdomain = getTenantSubdomainFromRequest(request) ?? bodySubdomain

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Tenant subdomain is required' },
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

    // Check if customer account already exists
    const customerAccounts = await readCustomerAccounts()
    const emailLower = email.toLowerCase().trim()
    const existingAccount = customerAccounts.find(
      a => a.email.toLowerCase() === emailLower && a.tenantId === tenant.id
    )

    if (existingAccount) {
      return NextResponse.json(
        { error: 'An account with this email already exists for this store' },
        { status: 400 }
      )
    }

    // Check if customer record exists (from previous orders)
    const customers = await readCustomers()
    let customer = customers.find(
      c => c.email.toLowerCase() === emailLower && c.tenantId === tenant.id
    )

    // Create customer if doesn't exist
    if (!customer) {
      customer = {
        id: `customer-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        tenantId: tenant.id,
        name,
        email: emailLower,
        phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      customers.push(customer)
      await writeCustomers(customers)
    } else {
      // Update existing customer info
      customer.name = name
      if (phone) customer.phone = phone
      customer.updatedAt = new Date().toISOString()
      await writeCustomers(customers)
    }

    // Create customer account
    const hashedPassword = await hashPassword(password)
    const customerAccount: CustomerAccount = {
      id: `customer-account-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      customerId: customer.id,
      tenantId: tenant.id,
      email: emailLower,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    customerAccounts.push(customerAccount)
    await writeCustomerAccounts(customerAccounts)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to register customer:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
