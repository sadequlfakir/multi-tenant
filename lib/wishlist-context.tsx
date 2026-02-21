'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

const MAX_WISHLIST_ITEMS = 200

interface WishlistContextType {
  wishlistIds: string[]
  addToWishlist: (productId: string) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
  toggleWishlist: (productId: string) => Promise<boolean>
  isInWishlist: (productId: string) => boolean
  getWishlistCount: () => number
  clearWishlist: () => Promise<void>
  isLoading: boolean
  isLoggedIn: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('customerToken')
}

export function WishlistProvider({ children, tenantId }: { children: ReactNode; tenantId: string }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if customer is logged in and load wishlist (login required – no guest wishlist)
  useEffect(() => {
    const token = getCustomerToken()
    const tenantIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('customerTenantId') : null
    const loggedIn = !!token && tenantIdFromStorage === tenantId
    setIsLoggedIn(loggedIn)

    if (!loggedIn || !token) {
      setWishlistIds([])
      setIsHydrated(true)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    fetch('/api/customer/wishlist', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return
        const ids = Array.isArray(data) ? data.map((item: any) => item.productId || item.product?.id).filter(Boolean) : []
        setWishlistIds(ids)
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load wishlist from API:', err)
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydrated(true)
          setIsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [tenantId])

  const addToWishlist = useCallback(async (productId: string) => {
    if (!productId) return

    const token = getCustomerToken()
    const tenantIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('customerTenantId') : null
    const loggedIn = !!token && tenantIdFromStorage === tenantId

    if (!loggedIn || !token) return

    try {
      const res = await fetch('/api/customer/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        setWishlistIds((prev) => {
          if (prev.includes(productId)) return prev
          if (prev.length >= MAX_WISHLIST_ITEMS) return prev
          return [...prev, productId]
        })
      }
    } catch (error) {
      console.error('Failed to add to wishlist:', error)
    }
  }, [tenantId])

  const removeFromWishlist = useCallback(async (productId: string) => {
    const token = getCustomerToken()
    const tenantIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('customerTenantId') : null
    if (!token || tenantIdFromStorage !== tenantId) return

    try {
      const res = await fetch(`/api/customer/wishlist?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setWishlistIds((prev) => prev.filter((id) => id !== productId))
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    }
  }, [tenantId])

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!productId) return false
    const isInList = wishlistIds.includes(productId)
    if (isInList) {
      await removeFromWishlist(productId)
      return false
    } else {
      await addToWishlist(productId)
      return true
    }
  }, [wishlistIds, addToWishlist, removeFromWishlist])

  const isInWishlist = useCallback((productId: string) => wishlistIds.includes(productId), [wishlistIds])

  const getWishlistCount = useCallback(() => wishlistIds.length, [wishlistIds])

  const clearWishlist = useCallback(async () => {
    const token = getCustomerToken()
    if (!token) return
    try {
      for (const productId of wishlistIds) {
        await fetch(`/api/customer/wishlist?productId=${encodeURIComponent(productId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      setWishlistIds([])
    } catch (error) {
      console.error('Failed to clear wishlist:', error)
    }
  }, [wishlistIds])

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        getWishlistCount,
        clearWishlist,
        isLoading,
        isLoggedIn,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
