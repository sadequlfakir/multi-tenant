-- Product variant options (e.g. Color, Size) and variant rows with inventory
-- variant_schema on product: defines option names and values, e.g. [{"name":"Color","values":["Red","Blue"]},{"name":"Size","values":["S","M","L"]}]
-- product_variants: one row per variant (e.g. Red/S, Red/M, ...) with sku, price_adjustment, stock

ALTER TABLE products
ADD COLUMN IF NOT EXISTS variant_schema JSONB DEFAULT NULL;

COMMENT ON COLUMN products.variant_schema IS 'Array of { name: string, values: string[] } e.g. [{"name":"Color","values":["Red","Blue"]}]';

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  options JSONB NOT NULL DEFAULT '{}',
  sku TEXT,
  price_adjustment DOUBLE PRECISION NOT NULL DEFAULT 0,
  stock INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

COMMENT ON COLUMN product_variants.options IS 'Option key-value e.g. {"Color":"Red","Size":"S"}';
