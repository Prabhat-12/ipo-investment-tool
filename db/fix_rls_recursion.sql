-- Run this migration in your Supabase SQL Editor to resolve RLS policy violations and recursion.
-- It explicitly separates SELECT, INSERT, UPDATE, and DELETE policies for the family_members table.

-- 1. Create a bypass view for family_members (runs as owner/postgres, bypassing RLS)
CREATE OR REPLACE VIEW public.family_members_bypass AS
SELECT group_id, user_id, role FROM public.family_members;

-- 2. Create helper functions with SECURITY DEFINER that query the bypass view
CREATE OR REPLACE FUNCTION public.is_group_member(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members_bypass
    WHERE group_id = group_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_group_admin(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members_bypass
    WHERE group_id = group_id_param AND user_id = user_id_param AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Explicitly set owners to postgres to ensure bypass privileges are active
ALTER FUNCTION public.is_group_member(UUID, UUID) OWNER TO postgres;
ALTER FUNCTION public.is_group_admin(UUID, UUID) OWNER TO postgres;

-- 4. Ensure no table has FORCE ROW LEVEL SECURITY (which would apply RLS checks to postgres owner)
ALTER TABLE public.family_members NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_applications NO FORCE ROW LEVEL SECURITY;

-- 5. Drop ALL existing policies on family_members to start fresh
DROP POLICY IF EXISTS "Members can view family members list" ON family_members;
DROP POLICY IF EXISTS "Admins can manage group members" ON family_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON family_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON family_members;
DROP POLICY IF EXISTS "Users can join a group" ON family_members;

-- 6. Re-apply family_members policies explicitly for each action
-- SELECT: Members can view family members list
CREATE POLICY "Members can view family members list" ON family_members 
    FOR SELECT TO authenticated 
    USING (public.is_group_member(group_id, auth.uid()));

-- INSERT: Users can insert their own membership OR admins can add members
CREATE POLICY "Allow insertions" ON family_members 
    FOR INSERT TO authenticated 
    WITH CHECK (
        auth.uid() = user_id 
        OR 
        public.is_group_admin(group_id, auth.uid())
    );

-- UPDATE: Admins can manage group members
CREATE POLICY "Admins can update members" ON family_members 
    FOR UPDATE TO authenticated 
    USING (public.is_group_admin(group_id, auth.uid()))
    WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- DELETE: Admins can delete members
CREATE POLICY "Admins can delete members" ON family_members 
    FOR DELETE TO authenticated 
    USING (public.is_group_admin(group_id, auth.uid()));

-- 7. Add recursion-free policy for family_groups management
DROP POLICY IF EXISTS "Creators can manage family group" ON family_groups;
CREATE POLICY "Creators can manage family group" ON family_groups FOR ALL TO authenticated 
    USING (auth.uid() = creator_id);
