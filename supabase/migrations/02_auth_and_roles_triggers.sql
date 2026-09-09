-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - AUTH & ROLES SETUP
-- MIGRATION 02: ROLE SEEDING, AUTH TRIGGERS, & ROLE HELPER FUNCTIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED DEFAULT ROLES
-- ------------------------------------------------------------------------------
INSERT INTO public.roles (name, description)
VALUES 
    ('USER', 'Citizen or consumer who generates e-waste and requests pickups'),
    ('INFORMAL_AGGREGATOR', 'Scrap godown/yard manager who coordinates collection, pricing, and formal sales'),
    ('COLLECTION_COLLECTOR', 'Field collector / kabadiwala who conducts pickups, weighing, and physical handovers'),
    ('AUTHORIZED_RECYCLER', 'CPCB/SPCB certified formal recycling and dismantling facility'),
    ('GOVERNMENT_ADMIN', 'Central/State pollution control board or municipal regulatory administrator')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS TO QUERY ROLES
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT r.name INTO user_role
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = target_user_id
    LIMIT 1;

    RETURN COALESCE(user_role, 'USER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(target_user_id UUID, check_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = target_user_id AND r.name = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. HANDLE NEW AUTH USER TRIGGER
-- Automatically copies new auth.users entries into public.profiles & public.user_roles
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role_name VARCHAR;
    target_role_id INT;
BEGIN
    -- Extract role from metadata (defaulting to USER)
    assigned_role_name := COALESCE(NEW.raw_user_meta_data->>'role', 'USER');

    -- Insert profile
    INSERT INTO public.profiles (
        id,
        phone,
        email,
        full_name,
        preferred_language,
        avatar_url,
        is_active,
        is_verified
    ) VALUES (
        NEW.id,
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', 'NA_' || SUBSTRING(NEW.id::TEXT, 1, 10)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Citizen User'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        NEW.raw_user_meta_data->>'avatar_url',
        true,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        full_name = EXCLUDED.full_name;

    -- Lookup role id
    SELECT id INTO target_role_id FROM public.roles WHERE name = assigned_role_name;
    IF target_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, target_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
