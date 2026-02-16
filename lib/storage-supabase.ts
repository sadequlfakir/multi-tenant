import { getSupabase } from './supabase'
import type { Tenant, Order, Customer, CustomerAccount, CustomerAddress } from './types'
import type { User, Admin, SessionData } from './types'

const SUPABASE_REQUIRED_MSG =
  'Supabase is required. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'

function requireSupabase() {
  const sb = getSupabase()
  if (!sb) throw new Error(SUPABASE_REQUIRED_MSG)
  return sb
}

function toTenant(row: Record<string, unknown>): Tenant {
  return {
    id: row.id as string,
    name: row.name as string,
    subdomain: row.subdomain as string,
    template: row.template as 'ecommerce' | 'portfolio',
    isTemplate: (row.is_template as boolean | null) ?? false,
    config: (row.config as Tenant['config']) ?? {},
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? '',
    password: row.password as string,
    tenantId: (row.tenant_id as string) ?? '',
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

function toAdmin(row: Record<string, unknown>): Admin {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? '',
    password: row.password as string,
    role: row.role as 'super_admin' | 'admin',
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

function toOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    orderNumber: row.order_number as string,
    items: (row.items as Order['items']) ?? [],
    customer: (row.customer as Order['customer']) ?? { name: '', email: '' },
    shipping: (row.shipping as Order['shipping']) ?? { address: '', city: '', zipCode: '' },
    payment: (row.payment as Order['payment']) ?? { method: 'other' },
    status: row.status as Order['status'],
    subtotal: Number(row.subtotal ?? 0),
    shippingCost: Number(row.shipping_cost ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

function toCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) ?? undefined,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

export async function readTenants(): Promise<Tenant[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('tenants').select('*').order('created_at', { ascending: true })
  if (error) {
    console.error('Supabase readTenants:', error)
    return []
  }
  return (data ?? []).map(toTenant)
}

export async function writeTenants(tenants: Tenant[]): Promise<void> {
  const sb = requireSupabase()
  const rows = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    subdomain: t.subdomain,
    template: t.template,
    is_template: t.isTemplate ?? false,
    config: t.config,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }))
  const { error } = await sb.from('tenants').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function readUsers(): Promise<User[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: true })
  if (error) {
    console.error('Supabase readUsers:', error)
    return []
  }
  return (data ?? []).map(toUser)
}

export async function writeUsers(users: User[]): Promise<void> {
  const sb = requireSupabase()
  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    password: u.password,
    tenant_id: u.tenantId || null,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
  }))
  const { error } = await sb.from('users').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function readAdmins(): Promise<Admin[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('admins').select('*').order('created_at', { ascending: true })
  if (error) {
    console.error('Supabase readAdmins:', error)
    return []
  }
  return (data ?? []).map(toAdmin)
}

export async function writeAdmins(admins: Admin[]): Promise<void> {
  const sb = requireSupabase()
  const rows = admins.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    password: a.password,
    role: a.role,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  }))
  const { error } = await sb.from('admins').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function readSessions(): Promise<Record<string, SessionData>> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('sessions').select('*')
  if (error) {
    console.error('Supabase readSessions:', error)
    return {}
  }
  const out: Record<string, SessionData> = {}
  for (const row of data ?? []) {
    const token = row.token as string
    out[token] = {
      userId: row.user_id as string,
      role: row.role as 'admin' | 'user' | 'customer',
      expires: Number(row.expires),
    }
  }
  return out
}

export async function writeSessions(sessions: Record<string, SessionData>): Promise<void> {
  const sb = requireSupabase()
  const rows = Object.entries(sessions).map(([token, s]) => ({
    token,
    user_id: s.userId,
    role: s.role,
    expires: s.expires,
  }))
  if (rows.length > 0) {
    const { error } = await sb.from('sessions').upsert(rows, { onConflict: 'token' })
    if (error) throw error
  }
  // Remove sessions that are no longer in the map (e.g. logout)
  const tokens = new Set(Object.keys(sessions))
  const { data: existing } = await sb.from('sessions').select('token')
  const toDelete = (existing ?? []).map((r: { token: string }) => r.token).filter((t: string) => !tokens.has(t))
  if (toDelete.length > 0) {
    const quoted = toDelete.map((t) => `"${String(t).replace(/"/g, '""')}"`).join(',')
    await sb.from('sessions').delete().filter('token', 'in', `(${quoted})`)
  }
}

export async function readOrders(): Promise<Order[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('Supabase readOrders:', error)
    return []
  }
  return (data ?? []).map(toOrder)
}

export async function writeOrders(orders: Order[]): Promise<void> {
  const sb = requireSupabase()
  const rows = orders.map((o) => ({
    id: o.id,
    tenant_id: o.tenantId,
    order_number: o.orderNumber,
    items: o.items,
    customer: o.customer,
    shipping: o.shipping,
    payment: o.payment,
    status: o.status,
    subtotal: o.subtotal,
    shipping_cost: o.shippingCost,
    tax: o.tax,
    total: o.total,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  }))
  const { error } = await sb.from('orders').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function readCustomers(): Promise<Customer[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('customers').select('*').order('created_at', { ascending: true })
  if (error) {
    console.error('Supabase readCustomers:', error)
    return []
  }
  return (data ?? []).map(toCustomer)
}

export async function writeCustomers(customers: Customer[]): Promise<void> {
  const sb = requireSupabase()
  const rows = customers.map((c) => ({
    id: c.id,
    tenant_id: c.tenantId,
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }))
  const { error } = await sb.from('customers').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function initializeDefaultAdmin(): Promise<void> {
  const admins = await readAdmins()
  if (admins.length === 0) {
    const { hashPassword } = await import('./password')
    const hashedPassword = await hashPassword('admin123')
    const defaultAdmin: Admin = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'super_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await writeAdmins([defaultAdmin])
  }
}

/**
 * Delete a user account and all related data: sessions, their tenant (and its orders/customers), then the user.
 * Call removeTenantFromCache(subdomain) after this if the user had a tenant.
 */
export async function deleteUserAccount(userId: string): Promise<{ subdomain: string | null }> {
  const sb = requireSupabase()
  const users = await readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found')

  const tenantId = user.tenantId || null
  let subdomain: string | null = null
  if (tenantId) {
    const tenants = await readTenants()
    const tenant = tenants.find((t) => t.id === tenantId)
    if (tenant) subdomain = tenant.subdomain
  }

  // 1) Delete all sessions for this user
  const { data: sessionRows } = await sb.from('sessions').select('token').eq('user_id', userId)
  const tokens = (sessionRows ?? []).map((r: { token: string }) => r.token)
  if (tokens.length > 0) {
    const quoted = tokens.map((t) => `"${String(t).replace(/"/g, '""')}"`).join(',')
    await sb.from('sessions').delete().filter('token', 'in', `(${quoted})`)
  }

  // 2) Delete tenant (cascade deletes orders and customers)
  if (tenantId) {
    await sb.from('tenants').delete().eq('id', tenantId)
  }

  // 3) Delete user
  await sb.from('users').delete().eq('id', userId)

  return { subdomain }
}

// Password reset tokens
export interface PasswordResetToken {
  id: string
  userId: string
  userType: 'user' | 'admin'
  token: string
  expiresAt: string
  used: boolean
  createdAt: string
}

export async function createPasswordResetToken(
  userId: string,
  userType: 'user' | 'admin'
): Promise<PasswordResetToken> {
  const sb = requireSupabase()
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
  
  const id = `prt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const row = {
    id,
    user_id: userId,
    user_type: userType,
    token,
    expires_at: expiresAt.toISOString(),
    used: false,
    created_at: new Date().toISOString(),
  }
  
  const { error } = await sb.from('password_reset_tokens').insert(row)
  if (error) throw error
  
  return {
    id,
    userId,
    userType,
    token,
    expiresAt: expiresAt.toISOString(),
    used: false,
    createdAt: row.created_at,
  }
}

export async function findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .single()
  
  if (error || !data) return null
  
  return {
    id: data.id as string,
    userId: data.user_id as string,
    userType: data.user_type as 'user' | 'admin',
    token: data.token as string,
    expiresAt: data.expires_at as string,
    used: data.used as boolean,
    createdAt: data.created_at as string,
  }
}

export async function markPasswordResetTokenAsUsed(token: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('token', token)
  if (error) throw error
}

export async function cleanupExpiredPasswordResetTokens(): Promise<void> {
  const sb = requireSupabase()
  const now = new Date().toISOString()
  await sb.from('password_reset_tokens').delete().lt('expires_at', now)
}

// Customer Accounts
function toCustomerAccount(row: Record<string, unknown>): CustomerAccount {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    tenantId: row.tenant_id as string,
    email: row.email as string,
    password: row.password as string,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

export async function readCustomerAccounts(): Promise<CustomerAccount[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('customer_accounts').select('*').order('created_at', { ascending: true })
  if (error) {
    console.error('Supabase readCustomerAccounts:', error)
    return []
  }
  return (data ?? []).map(toCustomerAccount)
}

export async function writeCustomerAccounts(accounts: CustomerAccount[]): Promise<void> {
  const sb = requireSupabase()
  const rows = accounts.map((a) => ({
    id: a.id,
    customer_id: a.customerId,
    tenant_id: a.tenantId,
    email: a.email,
    password: a.password,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  }))
  const { error } = await sb.from('customer_accounts').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

// Customer Addresses
function toCustomerAddress(row: Record<string, unknown>): CustomerAddress {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    address: row.address as string,
    city: row.city as string,
    state: (row.state as string) ?? undefined,
    zipCode: row.zip_code as string,
    country: (row.country as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    isDefault: (row.is_default as boolean) ?? false,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

export async function readCustomerAddresses(): Promise<CustomerAddress[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('customer_addresses').select('*').order('created_at', { ascending: true })
  if (error) {
    console.error('Supabase readCustomerAddresses:', error)
    return []
  }
  return (data ?? []).map(toCustomerAddress)
}

export async function writeCustomerAddresses(addresses: CustomerAddress[]): Promise<void> {
  const sb = requireSupabase()
  const rows = addresses.map((a) => ({
    id: a.id,
    customer_id: a.customerId,
    tenant_id: a.tenantId,
    name: a.name,
    address: a.address,
    city: a.city,
    state: a.state ?? null,
    zip_code: a.zipCode,
    country: a.country ?? null,
    phone: a.phone ?? null,
    is_default: a.isDefault,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  }))
  const { error } = await sb.from('customer_addresses').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}
