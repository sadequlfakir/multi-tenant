-- Products table for ecommerce tenants
-- Run via: supabase db push

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  image TEXT DEFAULT '',
  -- category stored as simple string (category name or slug)
  category TEXT,
  stock INTEGER,
  sku TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  seo_title TEXT,
  seo_description TEXT,
  -- store keywords as JSON array of strings for flexibility
  seo_keywords JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_status ON products(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_products_tenant_featured ON products(tenant_id, featured);
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON products(tenant_id, category);

