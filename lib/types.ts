export type TemplateType = 'ecommerce' | 'portfolio'

export interface Tenant {
  id: string
  name: string
  subdomain: string
  template: TemplateType
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

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category?: string
  stock?: number
  sku?: string
  featured?: boolean
  status?: 'active' | 'draft' | 'archived'
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

