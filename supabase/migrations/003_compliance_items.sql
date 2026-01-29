-- Compliance Items table for tracking landlord obligations
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS compliance_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN ('gas_safety', 'eicr', 'epc', 'legionella', 'smoke_co', 'other')),
  
  -- Certificate details
  certificate_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  inspector_name TEXT,
  inspector_company TEXT,
  notes TEXT,
  
  -- Document storage
  document_url TEXT,
  
  -- Status (auto-calculated via trigger, or manual)
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired')),
  
  -- Reminder settings
  reminder_days_before INTEGER DEFAULT 30,
  reminder_sent BOOLEAN DEFAULT FALSE,
  last_reminder_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_compliance_property ON compliance_items(property_id);
CREATE INDEX IF NOT EXISTS idx_compliance_expiry ON compliance_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_items(status);

-- Enable RLS
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view compliance items for their own properties
CREATE POLICY "Users can view own property compliance" ON compliance_items
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Policy: Users can insert compliance items for their own properties
CREATE POLICY "Users can insert own property compliance" ON compliance_items
  FOR INSERT WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Policy: Users can update their own property compliance
CREATE POLICY "Users can update own property compliance" ON compliance_items
  FOR UPDATE USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Policy: Users can delete their own property compliance
CREATE POLICY "Users can delete own property compliance" ON compliance_items
  FOR DELETE USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Function to update status based on expiry date
CREATE OR REPLACE FUNCTION update_compliance_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.status := 'expiring_soon';
  ELSE
    NEW.status := 'valid';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update status on insert/update
DROP TRIGGER IF EXISTS compliance_status_trigger ON compliance_items;
CREATE TRIGGER compliance_status_trigger
  BEFORE INSERT OR UPDATE OF expiry_date ON compliance_items
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_status();

-- Function to check and update all compliance statuses (run daily via cron)
CREATE OR REPLACE FUNCTION refresh_all_compliance_statuses()
RETURNS void AS $$
BEGIN
  UPDATE compliance_items
  SET status = 
    CASE 
      WHEN expiry_date < CURRENT_DATE THEN 'expired'
      WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'valid'
    END,
    updated_at = NOW()
  WHERE status != 
    CASE 
      WHEN expiry_date < CURRENT_DATE THEN 'expired'
      WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'valid'
    END;
END;
$$ LANGUAGE plpgsql;

-- View for compliance with property details (useful for queries)
CREATE OR REPLACE VIEW compliance_with_property AS
SELECT 
  c.*,
  p.address_line_1,
  p.address_line_2,
  p.city,
  p.postcode,
  p.landlord_id,
  CONCAT_WS(', ', p.address_line_1, p.city) as property_address
FROM compliance_items c
JOIN properties p ON c.property_id = p.id;
