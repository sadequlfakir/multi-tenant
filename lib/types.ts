export type TemplateType = 'ecommerce' | 'portfolio'

export interface Tenant {
  id: string
  name: string
  subdomain: string
  template: TemplateType
  /**
   * Owner user ID (dashboard user who created this site).
   * Optional for older data.
   */
  ownerUserId?: string
  /**
   * When true, this tenant acts as a reusable template
   * that can be cloned/used when creating new sites.
   */
  isTemplate?: boolean
  config: TenantConfig
  createdAt: string
  updatedAt: string
}

export interface TenantConfig {
  siteName: string
  siteDescription: string
  primaryColor?: string
  logo?: string
  favicon?: string
  customDomain?: string // Custom domain like mysite.com
  customDomainVerified?: boolean
  customDomainVerificationCode?: string // For DNS verification
  // E-commerce specific
  products?: Product[]
  categories?: Category[]
  variantOptionSets?: VariantOptionSet[]
  collections?: Collection[]
  sliders?: Slider[]
  banners?: Banner[]
  sliderConfig?: {
    autoPlay?: boolean
    interval?: number // in milliseconds
  }
  // Portfolio specific
  projects?: Project[]
  about?: string
  contactEmail?: string
  // SEO Settings
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  // Analytics
  analyticsId?: string
  // Theme
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
    darkMode?: boolean
  }
  // Social Links
  socialLinks?: {
    twitter?: string
    facebook?: string
    instagram?: string
    linkedin?: string
    github?: string
  }
  // Settings
  settings?: {
    allowComments?: boolean
    enableNewsletter?: boolean
    maintenanceMode?: boolean
  }
}

/** Defines one variant dimension, e.g. Color with values Red, Blue */
export interface VariantOptionSchema {
  name: string
  values: string[]
}

/** Reusable variant definition (e.g. "T-shirt options": Color + Size) stored per tenant */
export interface VariantOptionSet {
  id: string
  name: string
  schema: VariantOptionSchema[]
  createdAt?: string
  updatedAt?: string
}

/** One purchasable variant (e.g. Red / Size S) with its own SKU, price adjustment, stock */
export interface ProductVariant {
  id: string
  productId: string
  options: Record<string, string>
  sku?: string
  priceAdjustment: number
  stock?: number
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category?: string
  stock?: number
  sku?: string
  slug?: string // SEO-friendly URL slug
  featured?: boolean
  status?: 'active' | 'draft' | 'archived'
  /** Variant dimensions (e.g. Color, Size) and their values */
  variantSchema?: VariantOptionSchema[]
  /** Variant rows with inventory; populated on GET /api/products/[id] */
  variants?: ProductVariant[]
  /** SEO: custom meta title (defaults to name) */
  seoTitle?: string
  /** SEO: custom meta description (defaults to description) */
  seoDescription?: string
  /** SEO: meta keywords (comma-separated or array) */
  seoKeywords?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string // For subcategories
  order?: number // For custom ordering
  featured?: boolean
  status?: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

export interface Slider {
  id: string
  title?: string
  description?: string
  image: string
  link?: string
  buttonText?: string
  order?: number
  status?: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

export interface Banner {
  id: string
  title?: string
  description?: string
  image: string
  link?: string
  buttonText?: string
  position: 'after-categories' | 'after-products'
  status?: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

/** Home page collection: title, description, and product IDs to display. */
export interface Collection {
  id: string
  title: string
  description?: string
  productIds: string[]
  order?: number
  createdAt?: string
  updatedAt?: string
}

export interface Order {
  id: string
  tenantId: string
  orderNumber: string
  items: OrderItem[]
  customer: CustomerInfo
  shipping: ShippingInfo
  payment: PaymentInfo
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  productName: string
  productImage?: string
  quantity: number
  price: number
  subtotal: number
}

export interface CustomerInfo {
  name: string
  email: string
  phone?: string
}

export interface ShippingInfo {
  address: string
  city: string
  state?: string
  zipCode: string
  country?: string
}

export interface PaymentInfo {
  method: 'card' | 'cash' | 'other'
  cardLast4?: string
  transactionId?: string
}

// E-commerce customer created from unique order emails
export interface Customer {
  id: string
  tenantId: string
  name: string
  email: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  title: string
  description: string
  image: string
  link?: string
  technologies?: string[]
}

// Auth / storage (users, admins, sessions)
export interface User {
  id: string
  email: string
  name: string
  password: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface Admin {
  id: string
  email: string
  name: string
  password: string
  role: 'super_admin' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface SessionData {
  userId: string
  role: 'admin' | 'user' | 'customer'
  expires: number
}

// Customer account for e-commerce customers (separate from tenant owners)
export interface CustomerAccount {
  id: string
  customerId: string
  tenantId: string
  email: string
  password: string
  createdAt: string
  updatedAt: string
}

// Customer address (address book)
export interface CustomerAddress {
  id: string
  customerId: string
  tenantId: string
  name: string // Address label (e.g., "Home", "Work")
  address: string
  city: string
  state?: string
  zipCode: string
  country?: string
  phone?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Customer wishlist item
export interface CustomerWishlistItem {
  id: string
  customerId: string
  tenantId: string
  productId: string
  createdAt: string
  updatedAt: string
}

// Product review
export interface ProductReview {
  id: string
  productId: string
  tenantId: string
  customerId: string
  orderId: string
  rating: number // 1-5
  title?: string
  comment?: string
  createdAt: string
  updatedAt: string
  // Populated fields
  customerName?: string
  customerEmail?: string
}

// Product comment/Q&A
export interface ProductComment {
  id: string
  productId: string
  tenantId: string
  customerId: string
  comment: string
  parentId?: string // For replies
  createdAt: string
  updatedAt: string
  // Populated fields
  customerName?: string
  customerEmail?: string
  replies?: ProductComment[] // Nested replies
}

