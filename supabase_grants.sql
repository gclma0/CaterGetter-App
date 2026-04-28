-- ============================================================
-- GRANTS FIX — Run this in Supabase SQL Editor
-- This is the missing piece causing "permission denied for table" errors.
-- RLS policies alone aren't enough — PostgreSQL needs explicit role grants.
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews   TO anon, authenticated;
