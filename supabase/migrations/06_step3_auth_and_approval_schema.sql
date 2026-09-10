-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - AUTH & ROLE SECURITY
-- MIGRATION 06: ACCOUNT STATUSES, APPROVAL WORKFLOWS & EXTENDED PROFILES
-- ==============================================================================

-- 1. ACCOUNT STATUS ENUM
DO $$ BEGIN
    CREATE TYPE account_status_enum AS ENUM (
        'PENDING',
        'ACTIVE',
        'SUSPENDED',
        'REJECTED',
        'DEACTIVATED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ALTER PROFILES TABLE (Add account_status, general_location)
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS account_status account_status_enum DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS general_location VARCHAR(150),
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. EXTEND USER_ROLES TABLE
ALTER TABLE public.user_roles
    ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS status account_status_enum DEFAULT 'ACTIVE';

-- 4. AGGREGATOR PROFILE EXTENSIONS
ALTER TABLE public.aggregators
    ADD COLUMN IF NOT EXISTS materials_handled TEXT[] DEFAULT '{"CRT_DISPLAY", "PCB_ASSEMBLY", "LI_BATTERY", "CABLES_WIRES"}',
    ADD COLUMN IF NOT EXISTS operating_area VARCHAR(150),
    ADD COLUMN IF NOT EXISTS verification_status account_status_enum DEFAULT 'PENDING';

-- 5. COLLECTOR PROFILE EXTENSIONS
ALTER TABLE public.collectors
    ADD COLUMN IF NOT EXISTS operating_area VARCHAR(150),
    ADD COLUMN IF NOT EXISTS verification_status account_status_enum DEFAULT 'PENDING';

-- 6. RECYCLER PROFILE EXTENSIONS
ALTER TABLE public.recyclers
    ADD COLUMN IF NOT EXISTS facility_location VARCHAR(200),
    ADD COLUMN IF NOT EXISTS verification_status account_status_enum DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS authorization_status VARCHAR(50) DEFAULT 'SUBMITTED_FOR_VERIFICATION';

-- 7. SECURE USER CREATION TRIGGER
-- - Citizens (USER) self-register with 'ACTIVE' status.
-- - AGGREGATORS, COLLECTORS, and RECYCLERS register as 'PENDING' requiring approval.
-- - GOVERNMENT_ADMIN CANNOT be self-registered from public signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_role_name VARCHAR;
    assigned_role_name VARCHAR;
    target_role_id INT;
    initial_status account_status_enum;
BEGIN
    -- Extract requested role from metadata
    requested_role_name := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'USER'));

    -- SECURITY CHECK: Do NOT allow public signup as GOVERNMENT_ADMIN
    IF requested_role_name = 'GOVERNMENT_ADMIN' THEN
        assigned_role_name := 'USER'; -- Demote illicit attempt to standard citizen
        initial_status := 'ACTIVE';
    ELSIF requested_role_name IN ('INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER') THEN
        assigned_role_name := requested_role_name;
        initial_status := 'PENDING'; -- Professional roles require validation
    ELSE
        assigned_role_name := 'USER';
        initial_status := 'ACTIVE'; -- Citizen can immediately use platform
    END IF;

    -- Insert or Update profile
    INSERT INTO public.profiles (
        id,
        phone,
        email,
        role,
        full_name,
        preferred_language,
        avatar_url,
        account_status,
        general_location,
        is_active,
        is_verified
    ) VALUES (
        NEW.id,
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', 'NA_' || SUBSTRING(NEW.id::TEXT, 1, 10)),
        NEW.email,
        assigned_role_name,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        NEW.raw_user_meta_data->>'avatar_url',
        initial_status,
        COALESCE(NEW.raw_user_meta_data->>'general_location', 'India'),
        (initial_status = 'ACTIVE'),
        (initial_status = 'ACTIVE')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        preferred_language = COALESCE(EXCLUDED.preferred_language, profiles.preferred_language);

    -- Fetch role ID and assign in user_roles
    SELECT id INTO target_role_id FROM public.roles WHERE name = assigned_role_name;
    IF target_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, status)
        VALUES (NEW.id, target_role_id, initial_status)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    -- Create role-specific record skeleton if professional role
    IF assigned_role_name = 'INFORMAL_AGGREGATOR' THEN
        INSERT INTO public.aggregators (
            id, business_name, yard_address, city, state, pincode, location, verification_status
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'business_name', 'Aggregator Scrap Yard'),
            COALESCE(NEW.raw_user_meta_data->>'yard_address', 'Pending Verification'),
            'Mumbai', 'Maharashtra', '400001',
            ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography,
            'PENDING'
        ) ON CONFLICT (id) DO NOTHING;
    ELSIF assigned_role_name = 'COLLECTION_COLLECTOR' THEN
        INSERT INTO public.collectors (
            id, vehicle_type, current_location, verification_status
        ) VALUES (
            NEW.id,
            'BICYCLE',
            ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography,
            'PENDING'
        ) ON CONFLICT (id) DO NOTHING;
    ELSIF assigned_role_name = 'AUTHORIZED_RECYCLER' THEN
        INSERT INTO public.recyclers (
            id, company_name, facility_address, city, state, pincode, cpcb_authorization_number,
            cpcb_valid_upto, location, verification_status
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'company_name', 'Recycling Enterprise'),
            COALESCE(NEW.raw_user_meta_data->>'facility_address', 'Pending Verification'),
            'Mumbai', 'Maharashtra', '400001',
            COALESCE(NEW.raw_user_meta_data->>'cpcb_authorization_number', 'PENDING-VERIFICATION-' || SUBSTRING(NEW.id::TEXT, 1, 6)),
            CURRENT_DATE + INTERVAL '1 year',
            ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography,
            'PENDING'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. EXTENDED RLS FOR ACCOUNT STATUS
-- Ensure non-ACTIVE users cannot query business data
CREATE OR REPLACE FUNCTION public.is_active_account(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = target_user_id AND account_status = 'ACTIVE'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
