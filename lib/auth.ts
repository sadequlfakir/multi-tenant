import { readUsers, readAdmins, User, Admin, readSessions, writeSessions, SessionData, readCustomerAccounts, CustomerAccount } from './storage'
import { comparePassword } from './password'
import type { Customer } from './types'

// Session management with JSON persistence
let sessionsCache: Map<string, SessionData> | null = null
let sessionsLoaded = false

// Load sessions from storage
async function loadSessions(): Promise<void> {
  if (sessionsLoaded) return
  try {
    const sessionsData = await readSessions()
    sessionsCache = new Map(Object.entries(sessionsData))
    sessionsLoaded = true
    
    // Clean up expired sessions on load
    const now = Date.now()
    for (const [token, session] of sessionsCache.entries()) {
      if (session.expires < now) {
        sessionsCache.delete(token)
      }
    }
    if (sessionsCache.size !== Object.keys(sessionsData).length) {
      await saveSessions()
    }
  } catch (error) {
    sessionsCache = new Map()
    sessionsLoaded = true
  }
}

// Save sessions to storage
async function saveSessions(): Promise<void> {
  if (!sessionsCache) return
  try {
    const sessionsData = Object.fromEntries(sessionsCache)
    await writeSessions(sessionsData)
  } catch (error) {
    console.error('Failed to save sessions:', error)
  }
}

// Get sessions map (lazy load)
async function getSessions(): Promise<Map<string, SessionData>> {
  await loadSessions()
  if (!sessionsCache) {
    sessionsCache = new Map()
  }
  return sessionsCache
}

export interface AuthResult {
  success: boolean
  token?: string
  user?: User | Admin | CustomerAccount
  error?: string
}

export interface CustomerAuthResult {
  success: boolean
  token?: string
  customerAccount?: CustomerAccount
  customer?: Customer
  error?: string
}

// Generate session token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Token expiration: 90 days (in milliseconds)
const TOKEN_EXPIRATION = 90 * 24 * 60 * 60 * 1000

// Create session
export async function createSession(userId: string, role: 'admin' | 'user' | 'customer'): Promise<string> {
  const token = generateToken()
  const sessions = await getSessions()
  const sessionData: SessionData = {
    userId,
    role,
    expires: Date.now() + TOKEN_EXPIRATION, // 90 days
  }
  sessions.set(token, sessionData)
  await saveSessions()
  return token
}

// Get session with auto-refresh (extends expiration on use)
export async function getSession(token: string, autoRefresh: boolean = true): Promise<{ userId: string; role: 'admin' | 'user' | 'customer' } | null> {
  const sessions = await getSessions()
  const session = sessions.get(token)
  if (!session) {
    return null
  }
  
  // Check if expired
  if (session.expires < Date.now()) {
    sessions.delete(token)
    await saveSessions()
    return null
  }
  
  // Auto-refresh: extend expiration time on each use
  if (autoRefresh) {
    session.expires = Date.now() + TOKEN_EXPIRATION
    sessions.set(token, session)
    // Save in background (don't await to avoid blocking)
    saveSessions().catch(console.error)
  }
  
  return { userId: session.userId, role: session.role }
}

// Authenticate admin
export async function authenticateAdmin(email: string, password: string): Promise<AuthResult> {
  const admins = await readAdmins()
  const admin = admins.find(a => a.email === email)
  
  if (!admin) {
    return { success: false, error: 'Invalid credentials' }
  }
  
  const passwordMatch = await comparePassword(password, admin.password)
  if (!passwordMatch) {
    return { success: false, error: 'Invalid credentials' }
  }
  
  const token = await createSession(admin.id, 'admin')
  return { success: true, token, user: admin }
}

// Authenticate user
export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  const users = await readUsers()
  const user = users.find(u => u.email === email)
  
  if (!user) {
    return { success: false, error: 'Invalid credentials' }
  }
  
  const passwordMatch = await comparePassword(password, user.password)
  if (!passwordMatch) {
    return { success: false, error: 'Invalid credentials' }
  }
  
  const token = await createSession(user.id, 'user')
  return { success: true, token, user }
}

// Authenticate customer
export async function authenticateCustomer(email: string, password: string, tenantId: string): Promise<CustomerAuthResult> {
  const customerAccounts = await readCustomerAccounts()
  const account = customerAccounts.find(
    a => a.email.toLowerCase() === email.toLowerCase() && a.tenantId === tenantId
  )
  
  if (!account) {
    return { success: false, error: 'Invalid credentials' }
  }
  
  const passwordMatch = await comparePassword(password, account.password)
  if (!passwordMatch) {
    return { success: false, error: 'Invalid credentials' }
  }
  
  const token = await createSession(account.id, 'customer')
  
  // Get customer details
  const { readCustomers } = await import('./storage')
  const customers = await readCustomers()
  const customer = customers.find(c => c.id === account.customerId) || null
  
  return { success: true, token, customerAccount: account, customer: customer || undefined }
}

// Get authenticated user
export async function getAuthenticatedUser(token: string): Promise<User | Admin | null> {
  const session = await getSession(token)
  if (!session) return null
  
  if (session.role === 'admin') {
    const admins = await readAdmins()
    return admins.find(a => a.id === session.userId) || null
  } else if (session.role === 'user') {
    const users = await readUsers()
    return users.find(u => u.id === session.userId) || null
  }
  
  return null
}

// Get authenticated customer
export async function getAuthenticatedCustomer(token: string): Promise<{ account: CustomerAccount; customer: Customer } | null> {
  const session = await getSession(token)
  if (!session || session.role !== 'customer') return null
  
  const customerAccounts = await readCustomerAccounts()
  const account = customerAccounts.find(a => a.id === session.userId)
  if (!account) return null
  
  const { readCustomers } = await import('./storage')
  const customers = await readCustomers()
  const customer = customers.find(c => c.id === account.customerId)
  if (!customer) return null
  
  return { account, customer }
}

// Logout
export async function logout(token: string): Promise<void> {
  const sessions = await getSessions()
  sessions.delete(token)
  await saveSessions()
}
