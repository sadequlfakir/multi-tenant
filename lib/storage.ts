/**
 * Storage layer – Supabase only. All data (tenants, users, admins, sessions, orders, customers)
 * is read/written via Supabase. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 */

import type { Tenant, Order, Customer, User, Admin, SessionData, CustomerAccount, CustomerAddress } from './types'
import * as db from './storage-supabase'

export type { User, Admin, SessionData, CustomerAccount, CustomerAddress }

export async function readTenants(): Promise<Tenant[]> {
  return db.readTenants()
}

export async function writeTenants(tenants: Tenant[]): Promise<void> {
  return db.writeTenants(tenants)
}

export async function readUsers(): Promise<User[]> {
  return db.readUsers()
}

export async function writeUsers(users: User[]): Promise<void> {
  return db.writeUsers(users)
}

export async function readAdmins(): Promise<Admin[]> {
  return db.readAdmins()
}

export async function writeAdmins(admins: Admin[]): Promise<void> {
  return db.writeAdmins(admins)
}

export async function readSessions(): Promise<Record<string, SessionData>> {
  return db.readSessions()
}

export async function writeSessions(sessions: Record<string, SessionData>): Promise<void> {
  return db.writeSessions(sessions)
}

export async function readOrders(): Promise<Order[]> {
  return db.readOrders()
}

export async function writeOrders(orders: Order[]): Promise<void> {
  return db.writeOrders(orders)
}

export async function readCustomers(): Promise<Customer[]> {
  return db.readCustomers()
}

export async function writeCustomers(customers: Customer[]): Promise<void> {
  return db.writeCustomers(customers)
}

export async function initializeDefaultAdmin(): Promise<void> {
  return db.initializeDefaultAdmin()
}

/**
 * Delete user account and all related data (sessions, tenant, orders, customers).
 * Returns the deleted tenant's subdomain for cache invalidation, or null.
 */
export async function deleteUserAccount(userId: string): Promise<{ subdomain: string | null }> {
  return db.deleteUserAccount(userId)
}

export type { PasswordResetToken } from './storage-supabase'

export async function createPasswordResetToken(
  userId: string,
  userType: 'user' | 'admin'
): Promise<import('./storage-supabase').PasswordResetToken> {
  return db.createPasswordResetToken(userId, userType)
}

export async function findPasswordResetToken(token: string): Promise<import('./storage-supabase').PasswordResetToken | null> {
  return db.findPasswordResetToken(token)
}

export async function markPasswordResetTokenAsUsed(token: string): Promise<void> {
  return db.markPasswordResetTokenAsUsed(token)
}

export async function cleanupExpiredPasswordResetTokens(): Promise<void> {
  return db.cleanupExpiredPasswordResetTokens()
}

// Customer Accounts
export async function readCustomerAccounts(): Promise<CustomerAccount[]> {
  return db.readCustomerAccounts()
}

export async function writeCustomerAccounts(accounts: CustomerAccount[]): Promise<void> {
  return db.writeCustomerAccounts(accounts)
}

// Customer Addresses
export async function readCustomerAddresses(): Promise<CustomerAddress[]> {
  return db.readCustomerAddresses()
}

export async function writeCustomerAddresses(addresses: CustomerAddress[]): Promise<void> {
  return db.writeCustomerAddresses(addresses)
}
