-- ============================================================
-- VENDOR VISIBILITY FIX
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Approve all existing vendors (for MVP testing)
UPDATE public.vendors SET is_approved = true;

-- 2. Make new vendors auto-approved by default (no admin review needed for MVP)
ALTER TABLE public.vendors ALTER COLUMN is_approved SET DEFAULT true;

-- 3. Update the trigger to set is_approved = true for new vendor signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');

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

  IF user_role = 'vendor' THEN
    INSERT INTO public.vendors (id, business_name, cuisine_types, categories, is_approved)
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
      ),
      true  -- auto-approve for MVP
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create storage bucket for package images (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-images', 'package-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies
DROP POLICY IF EXISTS "Authenticated upload package images" ON storage.objects;
DROP POLICY IF EXISTS "Public read package images" ON storage.objects;

CREATE POLICY "Authenticated upload package images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'package-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public read package images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'package-images');

CREATE POLICY "Vendors can update their package images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'package-images' AND auth.role() = 'authenticated');

CREATE POLICY "Vendors can delete their package images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'package-images' AND auth.role() = 'authenticated');
