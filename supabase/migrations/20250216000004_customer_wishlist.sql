-- Customer wishlist table
-- Stores products that customers have added to their wishlist
CREATE TABLE IF NOT EXISTS customer_wishlist (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_wishlist_customer ON customer_wishlist(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlist_tenant ON customer_wishlist(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlist_product ON customer_wishlist(product_id);

COMMENT ON TABLE customer_wishlist IS 'Products saved to wishlist by customers. Each customer can add a product to wishlist once per tenant.';
