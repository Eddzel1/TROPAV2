-- Indexes to improve data fetching speed

-- 1. Index for family_members sorting and pagination
CREATE INDEX IF NOT EXISTS idx_family_members_created_date ON public.family_members (created_date DESC);

-- 2. Index for joining family_members to households
CREATE INDEX IF NOT EXISTS idx_family_members_household_id ON public.family_members (household_id);

-- 3. Indexes for commonly filtered fields in family_members
CREATE INDEX IF NOT EXISTS idx_family_members_is_cooperative_member ON public.family_members (is_cooperative_member);
CREATE INDEX IF NOT EXISTS idx_family_members_is_voter ON public.family_members (is_voter);
CREATE INDEX IF NOT EXISTS idx_family_members_is_household_leader ON public.family_members (is_household_leader);
CREATE INDEX IF NOT EXISTS idx_family_members_lgu_barangay ON public.family_members (lgu, barangay);

-- 4. Index for households sorting and pagination
CREATE INDEX IF NOT EXISTS idx_households_created_date ON public.households (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_households_lgu_barangay ON public.households (lgu, barangay);
