-- Add is_template flag to tenants (templates are regular tenants marked as reusable)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN tenants.is_template IS 'When true, this tenant is shown as a reusable template when creating new sites.';
