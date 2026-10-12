-- Adds TRU Care membership flag to family_members
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS trucare_member boolean NOT NULL DEFAULT false;
