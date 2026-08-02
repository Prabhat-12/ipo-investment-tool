-- PostgreSQL Schema for Indian IPO Tracker (Supabase)

-- Drop tables if they exist (for database initialization/reset)
DROP TABLE IF EXISTS anchor_investors CASCADE;
DROP TABLE IF EXISTS financials CASCADE;
DROP TABLE IF EXISTS peers CASCADE;
DROP TABLE IF EXISTS gmp_history CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS ipos CASCADE;

-- 1. IPOS table: stores the master data for each IPO
CREATE TABLE ipos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50),
    price_band_low NUMERIC(10, 2),
    price_band_high NUMERIC(10, 2),
    issue_size_cr NUMERIC(12, 2),
    fresh_issue_cr NUMERIC(12, 2),
    ofs_cr NUMERIC(12, 2),
    lot_size INTEGER,
    retail_lot_cost NUMERIC(12, 2),
    open_date DATE,
    close_date DATE,
    allotment_date DATE,
    refund_date DATE,
    listing_date DATE,
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'bidding', 'closed', 'allotment_pending', 'listed'
    listing_price NUMERIC(10, 2),
    listing_gains_pct NUMERIC(6, 2),
    
    -- Additional 2 metrics
    market_cap_cr NUMERIC(12, 2),
    post_ipo_promoter_holding_pct NUMERIC(5, 2),
    
    -- Decisions
    decision VARCHAR(10) DEFAULT 'PENDING', -- 'YES', 'NO', 'PENDING'
    decision_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching IPOs by name or symbol
CREATE INDEX idx_ipos_symbol ON ipos(symbol);
CREATE INDEX idx_ipos_status ON ipos(status);

-- 2. SUBSCRIPTIONS table: daily tracking of bidding multiples
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    qib NUMERIC(8, 2) DEFAULT 0.00,
    nii NUMERIC(8, 2) DEFAULT 0.00,
    retail NUMERIC(8, 2) DEFAULT 0.00,
    total NUMERIC(8, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ipo_id, date)
);

-- 3. GMP HISTORY table: daily informal grey market premium
CREATE TABLE gmp_history (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    gmp_rs NUMERIC(10, 2) DEFAULT 0.00,
    estimated_listing NUMERIC(10, 2),
    implied_gain_pct NUMERIC(6, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ipo_id, date)
);

-- 4. PEERS table: P/E comparison against listed competitors
CREATE TABLE peers (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    peer_name VARCHAR(255) NOT NULL,
    peer_pe NUMERIC(8, 2),
    ipo_pe NUMERIC(8, 2) -- IPO's P/E relative to this peer
);

-- 5. FINANCIALS table: Profit After Tax (PAT) and revenue trajectory for 3 fiscal years
CREATE TABLE financials (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    fiscal_year VARCHAR(20) NOT NULL, -- e.g., 'FY24', 'FY25'
    revenue_cr NUMERIC(12, 2),
    pat_cr NUMERIC(12, 2),
    pat_margin_pct NUMERIC(5, 2)
);

-- 6. ANCHOR INVESTORS table: Institutional allocations prior to opening
CREATE TABLE anchor_investors (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    investor_name VARCHAR(255) NOT NULL,
    shares_allocated BIGINT,
    amount_allocated_cr NUMERIC(12, 2),
    is_marquee BOOLEAN DEFAULT FALSE -- Flag if it belongs to blue-chip/Tier-1 list
);

-- Trigger to auto-update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ipos_modtime BEFORE UPDATE ON ipos FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_gmp_history_modtime BEFORE UPDATE ON gmp_history FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ====================================================
-- MULTI-USER & FAMILY GROUP EXTENSIONS
-- ====================================================

-- Enable RLS on core tables
ALTER TABLE ipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE peers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_investors ENABLE ROW LEVEL SECURITY;

-- Setup RLS policies on global market tables
CREATE POLICY "Public Read Access" ON ipos FOR SELECT USING (true);
CREATE POLICY "Scraper Admin Access" ON ipos FOR ALL TO service_role USING (true);

CREATE POLICY "Public Read Access" ON subscriptions FOR SELECT USING (true);
CREATE POLICY "Scraper Admin Access" ON subscriptions FOR ALL TO service_role USING (true);

CREATE POLICY "Public Read Access" ON gmp_history FOR SELECT USING (true);
CREATE POLICY "Scraper Admin Access" ON gmp_history FOR ALL TO service_role USING (true);

CREATE POLICY "Public Read Access" ON peers FOR SELECT USING (true);
CREATE POLICY "Scraper Admin Access" ON peers FOR ALL TO service_role USING (true);

CREATE POLICY "Public Read Access" ON financials FOR SELECT USING (true);
CREATE POLICY "Scraper Admin Access" ON financials FOR ALL TO service_role USING (true);

CREATE POLICY "Public Read Access" ON anchor_investors FOR SELECT USING (true);
CREATE POLICY "Scraper Admin Access" ON anchor_investors FOR ALL TO service_role USING (true);

-- Create profile and family relation schemas
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(255) NOT NULL,
    creator_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_members (
    id SERIAL PRIMARY KEY,
    group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    pan_mask VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    lots_applied INTEGER DEFAULT 1,
    bid_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    listing_profit_rs NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_applications ENABLE ROW LEVEL SECURITY;

-- Set RLS policies for multi-user schemas
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR ALL TO authenticated USING (auth.uid() = id);

CREATE POLICY "Members can view their family group" ON family_groups FOR SELECT TO authenticated 
    USING (id IN (SELECT group_id FROM family_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create family groups" ON family_groups FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Members can view family members list" ON family_members FOR SELECT TO authenticated 
    USING (group_id IN (SELECT group_id FROM family_members WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage group members" ON family_members FOR ALL TO authenticated 
    USING (group_id IN (SELECT group_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can manage personal accounts" ON user_accounts FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Group members can view family accounts" ON user_accounts FOR SELECT TO authenticated 
    USING (group_id IN (SELECT group_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage personal applications" ON user_applications FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Group members can view family applications" ON user_applications FOR SELECT TO authenticated 
    USING (account_id IN (SELECT id FROM user_accounts WHERE group_id IN (SELECT group_id FROM family_members WHERE user_id = auth.uid())));

-- Profile auto-creation on trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

