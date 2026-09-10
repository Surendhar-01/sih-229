-- Run this once in the Supabase SQL Editor.
-- Fixes: Database error saving new user during signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT;
  assigned_role TEXT;
  new_status account_status_enum;
  role_id_value INTEGER;
BEGIN
  requested_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'USER'));

  IF requested_role IN ('INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER') THEN
    assigned_role := requested_role;
    new_status := 'PENDING';
  ELSE
    assigned_role := 'USER';
    new_status := 'ACTIVE';
  END IF;

  INSERT INTO public.profiles (
    id, phone, email, role, full_name, preferred_language,
    account_status, general_location, is_active, is_verified
  ) VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', 'NA_' || LEFT(NEW.id::TEXT, 10)),
    NEW.email,
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    new_status,
    COALESCE(NEW.raw_user_meta_data->>'general_location', 'India'),
    new_status = 'ACTIVE',
    new_status = 'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    preferred_language = EXCLUDED.preferred_language;

  SELECT id INTO role_id_value FROM public.roles WHERE name = assigned_role LIMIT 1;
  IF role_id_value IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, role_id_value)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
