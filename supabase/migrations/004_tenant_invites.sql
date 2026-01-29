-- Add tenant support to LetLog

-- 1. Add tenant_id to tenancies (nullable, filled when tenant accepts invite)
ALTER TABLE tenancies ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);

-- 2. Create tenant_invites table
CREATE TABLE IF NOT EXISTS tenant_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS for tenant_invites
ALTER TABLE tenant_invites DISABLE ROW LEVEL SECURITY;

-- 4. Index for quick token lookup
CREATE INDEX IF NOT EXISTS idx_tenant_invites_token ON tenant_invites(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invites_email ON tenant_invites(email);
CREATE INDEX IF NOT EXISTS idx_tenancies_tenant ON tenancies(tenant_id);
