import { Tenant, Order, Customer } from './types'
import { promises as fs } from 'fs'
import { join } from 'path'

// Lazy initialization to avoid Edge Runtime issues
function getDataDir(): string {
  if (typeof process === 'undefined' || !process.cwd) {
    throw new Error('Storage functions require Node.js runtime')
  }
  return join(process.cwd(), 'data')
}

function getTenantsFile(): string {
  return join(getDataDir(), 'tenants.json')
}

function getUsersFile(): string {
  return join(getDataDir(), 'users.json')
}

function getAdminsFile(): string {
  return join(getDataDir(), 'admins.json')
}

function getSessionsFile(): string {
  return join(getDataDir(), 'sessions.json')
}

function getOrdersFile(): string {
  return join(getDataDir(), 'orders.json')
}

function getCustomersFile(): string {
  return join(getDataDir(), 'customers.json')
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    const dataDir = getDataDir()
    await fs.mkdir(dataDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

// Read JSON file
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(filePath, 'utf-8')
    if (!data || data.trim() === '') {
      return defaultValue
    }
    return JSON.parse(data)
  } catch (error: any) {
    // File doesn't exist or is invalid, return default
    if (error.code === 'ENOENT') {
      return defaultValue
    }
    console.error('Error reading JSON file:', error)
    return defaultValue
  }
}

// Write JSON file
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing JSON file:', error)
    throw error
  }
}

// Tenants storage
export async function readTenants(): Promise<Tenant[]> {
  return readJsonFile<Tenant[]>(getTenantsFile(), [])
}

export async function writeTenants(tenants: Tenant[]): Promise<void> {
  await writeJsonFile(getTenantsFile(), tenants)
}

// Users storage
export interface User {
  id: string
  email: string
  name: string
  password: string // In production, this should be hashed
  tenantId: string // Can be empty if user hasn't created a site yet
  createdAt: string
  updatedAt: string
}

export async function readUsers(): Promise<User[]> {
  return readJsonFile<User[]>(getUsersFile(), [])
}

export async function writeUsers(users: User[]): Promise<void> {
  await writeJsonFile(getUsersFile(), users)
}

// Admins storage
export interface Admin {
  id: string
  email: string
  name: string
  password: string // In production, this should be hashed
  role: 'super_admin' | 'admin'
  createdAt: string
  updatedAt: string
}

export async function readAdmins(): Promise<Admin[]> {
  return readJsonFile<Admin[]>(getAdminsFile(), [])
}

export async function writeAdmins(admins: Admin[]): Promise<void> {
  await writeJsonFile(getAdminsFile(), admins)
}

// Sessions storage
export interface SessionData {
  userId: string
  role: 'admin' | 'user'
  expires: number
}

export async function readSessions(): Promise<Record<string, SessionData>> {
  return readJsonFile<Record<string, SessionData>>(getSessionsFile(), {})
}

export async function writeSessions(sessions: Record<string, SessionData>): Promise<void> {
  await writeJsonFile(getSessionsFile(), sessions)
}

// Orders storage
export async function readOrders(): Promise<Order[]> {
  return readJsonFile<Order[]>(getOrdersFile(), [])
}

export async function writeOrders(orders: Order[]): Promise<void> {
  await writeJsonFile(getOrdersFile(), orders)
}

// Customers storage
export async function readCustomers(): Promise<Customer[]> {
  return readJsonFile<Customer[]>(getCustomersFile(), [])
}

export async function writeCustomers(customers: Customer[]): Promise<void> {
  await writeJsonFile(getCustomersFile(), customers)
}

// Initialize default admin if none exists
export async function initializeDefaultAdmin(): Promise<void> {
  const admins = await readAdmins()
  if (admins.length === 0) {
    const defaultAdmin: Admin = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Super Admin',
      password: 'admin123', // In production, hash this
      role: 'super_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await writeAdmins([defaultAdmin])
  }
}
