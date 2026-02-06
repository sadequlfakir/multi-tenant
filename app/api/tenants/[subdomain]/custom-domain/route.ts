import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySubdomain, updateTenantConfig, getAllTenants } from '@/lib/tenant-store'
import { cacheCustomDomain, cacheTenant, removeTenantFromCache } from '@/lib/tenant-cache'
import { getAuthenticatedUser } from '@/lib/auth'
import { readUsers } from '@/lib/storage'
import { checkTxtRecord } from '@/lib/dns-checker'

// GET - Get custom domain status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check if user owns this tenant
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const customDomain = tenant.config.customDomain || null
    const verificationCode = tenant.config.customDomainVerificationCode || null
    let dnsCheck: { ok: boolean; message: string; records?: string[]; error?: string } | null = null

    if (customDomain && verificationCode && !tenant.config.customDomainVerified) {
      const result = await checkTxtRecord(customDomain, verificationCode)
      dnsCheck = { ok: result.ok, message: result.message, records: result.records, error: result.error }
    }

    return NextResponse.json({
      customDomain,
      customDomainVerified: tenant.config.customDomainVerified || false,
      verificationCode,
      dnsCheck: dnsCheck ?? undefined,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get custom domain status' },
      { status: 500 }
    )
  }
}

// POST - Set/Update custom domain
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check if user owns this tenant
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Check if domain is already taken
    const allTenants = await getAllTenants()
    const existingTenant = allTenants.find(
      t => t.config.customDomain === domain && t.id !== tenant.id
    )
    if (existingTenant) {
      return NextResponse.json(
        { error: 'Domain is already in use' },
        { status: 409 }
      )
    }

    // Generate verification code
    const verificationCode = `verify-${Math.random().toString(36).substring(2, 15)}`

    const updatedTenant = await updateTenantConfig(subdomain, {
      customDomain: domain,
      customDomainVerified: false,
      customDomainVerificationCode: verificationCode,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to update custom domain' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      customDomain: domain,
      customDomainVerified: false,
      verificationCode,
      dnsInstructions: {
        type: 'TXT',
        name: domain,
        value: verificationCode,
        message: `Add a TXT record to your DNS with the value: ${verificationCode}`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set custom domain' },
      { status: 500 }
    )
  }
}

// PUT - Verify custom domain
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check if user owns this tenant
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const customDomain = tenant.config.customDomain
    const verificationCode = tenant.config.customDomainVerificationCode

    if (!customDomain) {
      return NextResponse.json(
        { error: 'No custom domain set' },
        { status: 400 }
      )
    }

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'No verification code. Set the domain again to get a new code.' },
        { status: 400 }
      )
    }

    const dnsResult = await checkTxtRecord(customDomain, verificationCode)
    const verified = dnsResult.ok

    const updatedTenant = await updateTenantConfig(subdomain, {
      customDomainVerified: verified,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to verify domain' },
        { status: 500 }
      )
    }

    if (verified && updatedTenant.config.customDomain) {
      cacheCustomDomain(updatedTenant.config.customDomain, subdomain)
    }

    return NextResponse.json({
      customDomain: updatedTenant.config.customDomain,
      customDomainVerified: verified,
      message: dnsResult.message,
      dnsCheck: {
        ok: dnsResult.ok,
        message: dnsResult.message,
        records: dnsResult.records,
        error: dnsResult.error,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}

// DELETE - Remove custom domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getAuthenticatedUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantBySubdomain(subdomain)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check if user owns this tenant
    if (!('role' in user)) {
      const users = await readUsers()
      const userData = users.find(u => u.id === user.id)
      if (userData?.tenantId !== tenant.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updatedTenant = await updateTenantConfig(subdomain, {
      customDomain: undefined,
      customDomainVerified: false,
      customDomainVerificationCode: undefined,
    })

    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Failed to remove custom domain' },
        { status: 500 }
      )
    }

    removeTenantFromCache(subdomain)
    cacheTenant(subdomain)

    return NextResponse.json({ success: true, message: 'Custom domain removed' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove custom domain' },
      { status: 500 }
    )
  }
}
