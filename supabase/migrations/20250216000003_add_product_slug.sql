-- Add slug field to products for SEO-friendly URLs
ALTER TABLE products
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index for slug per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_slug ON products(tenant_id, slug) WHERE slug IS NOT NULL;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

COMMENT ON COLUMN products.slug IS 'SEO-friendly URL slug. Must be unique per tenant. Auto-generated from name if not provided.';
