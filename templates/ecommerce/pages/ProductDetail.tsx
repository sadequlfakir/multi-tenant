'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tenant, Product, ProductVariant } from '@/lib/types'
import { getTenantLink } from '@/lib/link-utils'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { EcommerceHeader } from '@/components/ecommerce-header'

function findVariant(variants: ProductVariant[] | undefined, options: Record<string, string>): ProductVariant | null {
  if (!variants?.length) return null
  return (
    variants.find((v) => {
      const vOpts = v.options ?? {}
      if (Object.keys(vOpts).length !== Object.keys(options).length) return false
      return Object.entries(options).every(([k, v]) => vOpts[k] === v)
    }) ?? null
  )
}

interface ProductDetailProps {
  tenant: Tenant
  productId: string
}

export default function ProductDetail({ tenant, productId }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Selected variant options, e.g. { Color: 'Red', Size: 'S' }. */
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const { addToCart: addToCartContext } = useCart()

  const selectedVariant = useMemo(
    () => (product?.variants ? findVariant(product.variants, selectedOptions) : null),
    [product?.variants, selectedOptions]
  )
  const effectivePrice = product
    ? product.price + (selectedVariant?.priceAdjustment ?? 0)
    : 0
  const effectiveStock =
    product?.variantSchema?.length && product.variants?.length
      ? selectedVariant?.stock ?? null
      : product?.stock ?? null
  const hasVariants = Boolean(product?.variantSchema?.length && product.variants?.length)
  const allOptionsSelected =
    !hasVariants ||
    (product?.variantSchema?.every((opt) => selectedOptions[opt.name]) ?? false)
  const canAddToCart =
    !hasVariants || (allOptionsSelected && (effectiveStock == null || effectiveStock > 0))

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(
          `/api/products/${productId}?subdomain=${encodeURIComponent(tenant.subdomain)}`
        )
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load product')
        }
        if (!cancelled) {
          setProduct(data as Product)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load product')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [productId, tenant.subdomain])

  useEffect(() => {
    if (!product?.variantSchema?.length) return
    setSelectedOptions((prev) => {
      const next: Record<string, string> = {}
      for (const opt of product.variantSchema ?? []) {
        if (prev[opt.name] && opt.values.includes(prev[opt.name])) {
          next[opt.name] = prev[opt.name]
        } else if (opt.values[0]) {
          next[opt.name] = opt.values[0]
        }
      }
      return Object.keys(next).length ? next : prev
    })
  }, [product?.id, product?.variantSchema])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading product...</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">
            {error || 'Product not found'}
          </h1>
          <Link href={getTenantLink(tenant, '/products')} className="text-primary hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const addToCart = () => {
    if (!product) return
    const result = addToCartContext(
      {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        description: product.description,
        stock: hasVariants ? (selectedVariant?.stock ?? 0) : product.stock,
        variantId: selectedVariant?.id,
        variantOptions: hasVariants ? selectedOptions : undefined,
        variantPriceAdjustment: selectedVariant?.priceAdjustment,
      },
      quantity
    )
    const button = document.querySelector('[data-add-to-cart]') as HTMLElement
    if (button) {
      const originalText = button.textContent
      button.textContent = result.success ? (result.message || 'Added to Cart!') : (result.message || 'Could not add')
      setTimeout(() => {
        button.textContent = originalText
      }, 2500)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <EcommerceHeader tenant={tenant} />

      {/* Product Detail */}
      <section className="container mx-auto px-4 py-12">
        <Link href={getTenantLink(tenant, '/products')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">{product.name}</h1>
            <p className="text-3xl font-bold text-primary mb-6">${effectivePrice.toFixed(2)}</p>
            <p className="text-muted-foreground mb-6 text-lg">{product.description}</p>

            {product.category && (
              <p className="text-sm text-muted-foreground mb-6">Category: {product.category}</p>
            )}

            {hasVariants &&
              product.variantSchema?.map((opt) => (
                <div key={opt.name} className="mb-4">
                  <label className="font-semibold block mb-2">{opt.name}</label>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant={selectedOptions[opt.name] === val ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))
                        }
                      >
                        {val}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

            {effectiveStock != null && effectiveStock >= 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                {effectiveStock > 0 ? `In stock: ${effectiveStock}` : 'Out of stock'}
              </p>
            )}

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="font-semibold">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center tabular-nums">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(
                            q + 1,
                            effectiveStock != null && effectiveStock >= 0 ? effectiveStock : 99
                          )
                        )
                      }
                      disabled={
                        effectiveStock != null && effectiveStock >= 0 && quantity >= effectiveStock
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </Button>
                  </div>
                  {effectiveStock != null && effectiveStock >= 0 && (
                    <span className="text-sm text-muted-foreground">Max: {effectiveStock}</span>
                  )}
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={addToCart}
                  data-add-to-cart
                  disabled={!canAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {!allOptionsSelected
                    ? 'Select options'
                    : effectiveStock === 0
                      ? 'Out of stock'
                      : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>

            {/* Comments section – only shown when Allow Comments is enabled in Settings */}
            {tenant.config.settings?.allowComments !== false && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Comments</h3>
                  <p className="text-muted-foreground text-sm">
                    Comments are enabled for this product. A full comment system (post, moderate, reply) can be added later with an API and storage.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border text-card-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {tenant.config.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

