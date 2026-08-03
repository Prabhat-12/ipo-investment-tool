-- Migration script to convert IPO Tracker to Multi-User & Family Shared Portfolios
-- Paste and run this SQL in your Supabase SQL Editor

-- 1. Enable RLS on existing global tables
ALTER TABLE ipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE peers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_investors ENABLE ROW LEVEL SECURITY;

-- 2. Setup RLS policies on existing global tables (Public READ, Admin Scraper WRITE via service_role)
DROP POLICY IF EXISTS "Public Read Access" ON ipos;
CREATE POLICY "Public Read Access" ON ipos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Scraper Admin Access" ON ipos;
CREATE POLICY "Scraper Admin Access" ON ipos FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON subscriptions;
CREATE POLICY "Public Read Access" ON subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Scraper Admin Access" ON subscriptions;
CREATE POLICY "Scraper Admin Access" ON subscriptions FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON gmp_history;
CREATE POLICY "Public Read Access" ON gmp_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Scraper Admin Access" ON gmp_history;
CREATE POLICY "Scraper Admin Access" ON gmp_history FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON peers;
CREATE POLICY "Public Read Access" ON peers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Scraper Admin Access" ON peers;
CREATE POLICY "Scraper Admin Access" ON peers FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON financials;
CREATE POLICY "Public Read Access" ON financials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Scraper Admin Access" ON financials;
CREATE POLICY "Scraper Admin Access" ON financials FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON anchor_investors;
CREATE POLICY "Public Read Access" ON anchor_investors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Scraper Admin Access" ON anchor_investors;
CREATE POLICY "Scraper Admin Access" ON anchor_investors FOR ALL TO service_role USING (true);

-- 3. Create Multi-User and Family Group Schema Tables
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(255) NOT NULL,
    creator_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_members (
    id SERIAL PRIMARY KEY,
    group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL, -- Null if personal
    account_holder_name VARCHAR(255) NOT NULL,
    pan_mask VARCHAR(10) NOT NULL, -- e.g., ABCDE***1F
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    lots_applied INTEGER DEFAULT 1,
    bid_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'ALLOTTED', 'REFUNDED'
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

-- 4. Set RLS Policies on Multi-User Tables
-- Profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- Security Definer helper functions to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members
    WHERE group_id = group_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_group_admin(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members
    WHERE group_id = group_id_param AND user_id = user_id_param AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Family Groups
DROP POLICY IF EXISTS "Members can view their family group" ON family_groups;
CREATE POLICY "Members can view their family group" ON family_groups FOR SELECT TO authenticated 
    USING (public.is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create family groups" ON family_groups;
CREATE POLICY "Users can create family groups" ON family_groups FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = creator_id);

-- Family Members
DROP POLICY IF EXISTS "Members can view family members list" ON family_members;
CREATE POLICY "Members can view family members list" ON family_members FOR SELECT TO authenticated 
    USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Admins can manage group members" ON family_members;
CREATE POLICY "Admins can manage group members" ON family_members FOR ALL TO authenticated 
    USING (public.is_group_admin(group_id, auth.uid()));

-- User Accounts (PAN slots)
DROP POLICY IF EXISTS "Users can manage personal accounts" ON user_accounts;
CREATE POLICY "Users can manage personal accounts" ON user_accounts FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Group members can view family accounts" ON user_accounts;
CREATE POLICY "Group members can view family accounts" ON user_accounts FOR SELECT TO authenticated 
    USING (public.is_group_member(group_id, auth.uid()));

-- User Applications (Bids)
DROP POLICY IF EXISTS "Users can manage personal applications" ON user_applications;
CREATE POLICY "Users can manage personal applications" ON user_applications FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Group members can view family applications" ON user_applications;
CREATE POLICY "Group members can view family applications" ON user_applications FOR SELECT TO authenticated 
    USING (account_id IN (
        SELECT id FROM user_accounts 
        WHERE public.is_group_member(group_id, auth.uid())
    ));

-- 5. Automate Profile Creation on Auth Signup (includes email field)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
