-- Customer accounts for e-commerce customers (separate from tenant owners)
-- Customers can log in to view their orders and manage addresses
CREATE TABLE IF NOT EXISTS customer_accounts (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_accounts_customer ON customer_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_tenant ON customer_accounts(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_tenant_email ON customer_accounts(tenant_id, LOWER(email));

-- Customer addresses (address book)
CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Address label (e.g., "Home", "Work")
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT NOT NULL,
  country TEXT,
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_tenant ON customer_addresses(tenant_id);

-- Update sessions table to support customer role
-- Note: This will fail if sessions table doesn't exist, but that's fine as it's created in initial schema
DO $$
BEGIN
  -- Check if constraint exists and drop it if it does
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sessions_role_check' 
    AND conrelid = 'sessions'::regclass
  ) THEN
    ALTER TABLE sessions DROP CONSTRAINT sessions_role_check;
  END IF;
  
  -- Add new constraint with customer role
  ALTER TABLE sessions ADD CONSTRAINT sessions_role_check 
    CHECK (role IN ('admin', 'user', 'customer'));
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, will be created by initial schema
    NULL;
END $$;

COMMENT ON TABLE customer_accounts IS 'Authentication accounts for e-commerce customers. Each customer can have one account per tenant.';
COMMENT ON TABLE customer_addresses IS 'Saved addresses for customers. Customers can have multiple addresses and mark one as default.';
