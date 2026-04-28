-- ============================================================
-- CaterApp - Supabase SQL Schema (Full + Reviews)
-- Run this entire script in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  role text CHECK (role IN ('customer', 'vendor', 'admin')) DEFAULT 'customer',
  created_at timestamptz DEFAULT now()
);

-- 2. VENDORS (caterer business info)
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  description text,
  banner_url text,
  photo_urls text[] DEFAULT '{}',
  cuisine_types text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  location text,
  rating numeric(3,1) DEFAULT 5.0,
  total_reviews int DEFAULT 0,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. PACKAGES (menu items offered by vendors)
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  price_per_person numeric,
  min_guests int,
  max_guests int,
  image_url text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add price_per_person if upgrading existing schema
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS price_per_person numeric;

-- Add photo_urls to vendors if upgrading
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- 4. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  event_date date NOT NULL,
  guest_count int,
  event_type text,
  special_requests text,
  status text CHECK (status IN ('pending','accepted','rejected','cancelled','completed')) DEFAULT 'pending',
  total_price numeric,
  created_at timestamptz DEFAULT now()
);

-- 5. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  rating int CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- GRANTS — Must come before RLS policies
-- Without these, PostgreSQL rejects all requests with "permission denied"
-- even if RLS policies exist.
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews   TO anon, authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (safe for re-runs)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- ============================================================
-- TRIGGER: Auto-create profile (and vendor) row on signup
-- Reads data from raw_user_meta_data passed via signUp options.data
-- Runs as SECURITY DEFINER → bypasses RLS entirely
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');

  -- Create (or update) the profile row
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    user_role
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone     = EXCLUDED.phone,
        role      = EXCLUDED.role;

  -- If registering as vendor, also create the vendors row
  IF user_role = 'vendor' THEN
    INSERT INTO public.vendors (id, business_name, cuisine_types, categories)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'business_name', 'My Business'),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'cuisine_types')),
        '{}'::text[]
      ),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'categories')),
        '{}'::text[]
      )
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


DROP POLICY IF EXISTS "Anyone can view approved vendors" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can update their own record" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can insert their own record" ON public.vendors;
DROP POLICY IF EXISTS "Anyone can view available packages" ON public.packages;
DROP POLICY IF EXISTS "Vendors can manage their own packages" ON public.packages;
DROP POLICY IF EXISTS "Vendors can update their own packages" ON public.packages;
DROP POLICY IF EXISTS "Vendors can delete their own packages" ON public.packages;
DROP POLICY IF EXISTS "Customers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Vendors can update booking status" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can insert reviews for completed bookings" ON public.reviews;

-- PROFILES policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- VENDORS policies
CREATE POLICY "Anyone can view approved vendors"
  ON public.vendors FOR SELECT USING (is_approved = true OR auth.uid() = id);
CREATE POLICY "Vendors can update their own record"
  ON public.vendors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Vendors can insert their own record"
  ON public.vendors FOR INSERT WITH CHECK (auth.uid() = id);

-- PACKAGES policies
CREATE POLICY "Anyone can view available packages"
  ON public.packages FOR SELECT USING (is_available = true OR vendor_id = auth.uid());
CREATE POLICY "Vendors can manage their own packages"
  ON public.packages FOR INSERT WITH CHECK (vendor_id = auth.uid());
CREATE POLICY "Vendors can update their own packages"
  ON public.packages FOR UPDATE USING (vendor_id = auth.uid());
CREATE POLICY "Vendors can delete their own packages"
  ON public.packages FOR DELETE USING (vendor_id = auth.uid());

-- BOOKINGS policies
CREATE POLICY "Customers can view their bookings"
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid() OR vendor_id = auth.uid());
CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Vendors can update booking status"
  ON public.bookings FOR UPDATE USING (vendor_id = auth.uid() OR customer_id = auth.uid());

-- REVIEWS policies
CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert reviews for completed bookings"
  ON public.reviews FOR INSERT WITH CHECK (customer_id = auth.uid());

-- ============================================================
-- FUNCTION: Auto-update vendor rating on review insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE public.vendors
  SET
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.reviews
      WHERE vendor_id = NEW.vendor_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM public.reviews WHERE vendor_id = NEW.vendor_id
    )
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_inserted ON public.reviews;
CREATE TRIGGER on_review_inserted
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_vendor_rating();
