-- LetLog Initial Schema
-- Run this in Supabase SQL Editor

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'landlord' CHECK (role IN ('landlord', 'tenant', 'contractor')),
  phone TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  subscription_plan TEXT DEFAULT 'free',
  stripe_subscription_id TEXT,
  subscription_current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  property_type TEXT DEFAULT 'house',
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenancies table
CREATE TABLE IF NOT EXISTS tenancies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE,
  rent_amount DECIMAL(10,2),
  rent_frequency TEXT DEFAULT 'monthly',
  deposit_amount DECIMAL(10,2),
  deposit_scheme TEXT,
  deposit_reference TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenders table (jobs posted by landlords)
CREATE TABLE IF NOT EXISTS tenders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES profiles(id),
  issue_id UUID REFERENCES issues(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table (from contractors)
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  available_from DATE,
  estimated_duration TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  property_id UUID REFERENCES properties(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties: Landlords can manage their own properties
CREATE POLICY "Landlords can view own properties" ON properties FOR SELECT USING (landlord_id = auth.uid());
CREATE POLICY "Landlords can insert properties" ON properties FOR INSERT WITH CHECK (landlord_id = auth.uid());
CREATE POLICY "Landlords can update own properties" ON properties FOR UPDATE USING (landlord_id = auth.uid());
CREATE POLICY "Landlords can delete own properties" ON properties FOR DELETE USING (landlord_id = auth.uid());

-- Rooms: Access via property ownership
CREATE POLICY "Access rooms via property" ON rooms FOR ALL USING (
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);

-- Photos: Access via property ownership
CREATE POLICY "Access photos via property" ON photos FOR ALL USING (
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);

-- Tenancies: Landlords and tenants can view relevant tenancies
CREATE POLICY "View own tenancies" ON tenancies FOR SELECT USING (
  tenant_id = auth.uid() OR
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);
CREATE POLICY "Landlords manage tenancies" ON tenancies FOR ALL USING (
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);

-- Issues: Landlords and tenants can manage issues
CREATE POLICY "View own issues" ON issues FOR SELECT USING (
  reported_by = auth.uid() OR
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);
CREATE POLICY "Create issues" ON issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Update own issues" ON issues FOR UPDATE USING (
  reported_by = auth.uid() OR
  property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid())
);

-- Tenders: Landlords manage, contractors view open ones
CREATE POLICY "View open tenders" ON tenders FOR SELECT USING (
  status = 'open' OR landlord_id = auth.uid()
);
CREATE POLICY "Landlords manage tenders" ON tenders FOR ALL USING (landlord_id = auth.uid());

-- Quotes: Contractors manage their own, landlords view on their tenders
CREATE POLICY "View relevant quotes" ON quotes FOR SELECT USING (
  contractor_id = auth.uid() OR
  tender_id IN (SELECT id FROM tenders WHERE landlord_id = auth.uid())
);
CREATE POLICY "Contractors manage own quotes" ON quotes FOR ALL USING (contractor_id = auth.uid());

-- Reviews: Anyone can view, users manage their own
CREATE POLICY "View all reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Create own reviews" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Update own reviews" ON reviews FOR UPDATE USING (reviewer_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_property ON tenancies(property_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_tenant ON tenancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_issues_property ON issues(property_id);
CREATE INDEX IF NOT EXISTS idx_tenders_landlord ON tenders(landlord_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tender ON quotes(tender_id);
CREATE INDEX IF NOT EXISTS idx_quotes_contractor ON quotes(contractor_id);
