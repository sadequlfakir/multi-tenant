'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/** Minimal product data stored with each cart line so the cart can render without API lookups. */
export interface CartProductSnapshot {
  id: string
  name: string
  image: string
  price: number
  description?: string
  /** If set, quantity cannot exceed this (stock). */
  stock?: number
  /** Variant id when product has variants. */
  variantId?: string
  /** e.g. { Color: 'Red', Size: 'S' } for display. */
  variantOptions?: Record<string, string>
  /** Added to base price for display. */
  variantPriceAdjustment?: number
}

export interface CartItem {
  productId: string
  quantity: number
  name: string
  image: string
  price: number
  description?: string
  stock?: number
  variantId?: string
  variantOptions?: Record<string, string>
  variantPriceAdjustment?: number
}

const STORAGE_KEY_PREFIX = 'cart-'
const MAX_QUANTITY_PER_PRODUCT = 99
const MAX_CART_ITEMS = 100

function cartItemKey(item: { productId: string; variantId?: string }) {
  return `${item.productId}:${item.variantId ?? ''}`
}

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== 'object') return false
  const o = item as Record<string, unknown>
  return (
    typeof o.productId === 'string' &&
    typeof o.quantity === 'number' &&
    o.quantity >= 1 &&
    typeof (o as CartItem).name === 'string' &&
    typeof (o as CartItem).image === 'string' &&
    typeof (o as CartItem).price === 'number'
  )
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: CartProductSnapshot, quantity: number) => { success: boolean; message?: string }
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartCount: () => number
  maxQuantityPerProduct: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children, tenantId }: { children: ReactNode; tenantId: string }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const storageKey = `${STORAGE_KEY_PREFIX}${tenantId}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) {
        setIsHydrated(true)
        return
      }
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed.filter(isValidCartItem) : []
      setCart(list)
    } catch (e) {
      console.error('Failed to load cart:', e)
    }
    setIsHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart))
    } catch (e) {
      console.error('Failed to save cart:', e)
    }
  }, [cart, storageKey, isHydrated])

  const addToCart = (product: CartProductSnapshot, quantity: number): { success: boolean; message?: string } => {
    if (quantity < 1) return { success: false, message: 'Quantity must be at least 1' }

    const maxForProduct =
      product.stock != null && product.stock >= 0
        ? Math.min(MAX_QUANTITY_PER_PRODUCT, product.stock)
        : MAX_QUANTITY_PER_PRODUCT

    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.productId === product.id && (item.variantId ?? '') === (product.variantId ?? '')
      )
      const currentQty = existing ? existing.quantity : 0
      const addedQty = Math.min(quantity, Math.max(0, maxForProduct - currentQty))
      if (addedQty <= 0) return prevCart

      const totalItems = prevCart.reduce((s, i) => s + i.quantity, 0)
      const canAdd = Math.min(addedQty, MAX_CART_ITEMS - totalItems)
      if (canAdd <= 0) return prevCart

      const newQty = currentQty + canAdd
      const snapshot: CartItem = {
        productId: product.id,
        quantity: newQty,
        name: product.name,
        image: product.image,
        price: product.price,
        description: product.description,
        stock: product.stock,
        variantId: product.variantId,
        variantOptions: product.variantOptions,
        variantPriceAdjustment: product.variantPriceAdjustment,
      }

      if (existing) {
        return prevCart.map((item) =>
          item.productId === product.id && (item.variantId ?? '') === (product.variantId ?? '') ? snapshot : item
        )
      }
      return [...prevCart, snapshot]
    })

    const existing = cart.find(
      (item) => item.productId === product.id && (item.variantId ?? '') === (product.variantId ?? '')
    )
    const currentQty = existing ? existing.quantity : 0
    const wouldAdd = Math.min(quantity, Math.max(0, maxForProduct - currentQty))
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0)
    const canAdd = Math.min(wouldAdd, MAX_CART_ITEMS - totalItems)

    if (canAdd <= 0) {
      return {
        success: false,
        message:
          totalItems >= MAX_CART_ITEMS
            ? `Cart is full (max ${MAX_CART_ITEMS} items)`
            : product.stock != null && currentQty >= product.stock
              ? `Maximum stock (${product.stock}) already in cart`
              : `Maximum ${MAX_QUANTITY_PER_PRODUCT} per product`,
      }
    }
    if (canAdd < quantity) {
      return {
        success: true,
        message:
          canAdd === wouldAdd
            ? `Only ${canAdd} added (max ${maxForProduct} for this product)`
            : `Only ${canAdd} added (cart limit ${MAX_CART_ITEMS} items)`,
      }
    }
    return { success: true }
  }

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && (item.variantId ?? '') === (variantId ?? ''))
      )
    )
  }

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity < 1) {
      removeFromCart(productId, variantId)
      return
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId || (item.variantId ?? '') !== (variantId ?? '')) return item
        const max = item.stock != null && item.stock >= 0 ? Math.min(MAX_QUANTITY_PER_PRODUCT, item.stock) : MAX_QUANTITY_PER_PRODUCT
        const qty = Math.min(quantity, max)
        return { ...item, quantity: qty }
      })
    )
  }

  const clearCart = () => setCart([])

  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        maxQuantityPerProduct: MAX_QUANTITY_PER_PRODUCT,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
