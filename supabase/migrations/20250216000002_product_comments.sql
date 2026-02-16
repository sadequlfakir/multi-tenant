-- Product comments/Q&A system
-- Any logged-in customer can comment or ask questions about products (no purchase required)
CREATE TABLE IF NOT EXISTS product_comments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_id TEXT REFERENCES product_comments(id) ON DELETE CASCADE, -- For replies/nested comments
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_comments_product ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_tenant ON product_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_customer ON product_comments(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON product_comments(parent_id);

COMMENT ON TABLE product_comments IS 'Product comments and Q&A. Any logged-in customer can comment or ask questions about products.';
