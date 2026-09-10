-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - COMPLETE SUPABASE DATABASE SETUP (UPDATED STEP 3)
-- Paste and run this script in the Supabase Dashboard SQL Editor
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Enumerated Types
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

DO $$ BEGIN
    CREATE TYPE lot_status_enum AS ENUM (
        'CREATED',
        'AI_ANALYZED',
        'WAITING_FOR_QUOTE',
        'AGGREGATOR_REVIEW',
        'COLLECTOR_MATCHED',
        'COLLECTION_ASSIGNED',
        'COLLECTOR_ACCEPTED',
        'ON_THE_WAY',
        'ARRIVED',
        'MATERIAL_VERIFIED',
        'COLLECTED',
        'AT_AGGREGATOR',
        'RECYCLER_MATCHED',
        'QUOTE_RECEIVED',
        'HANDOVER_PENDING',
        'HANDOVER_COMPLETED',
        'PAYMENT_PENDING',
        'PAID',
        'COMPLETED',
        'CANCELLED',
        'REJECTED',
        'DISPUTED',
        'FLAGGED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Core Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr', 'ta', 'te', 'kn', 'bn')),
    avatar_url TEXT,
    account_status account_status_enum DEFAULT 'PENDING',
    general_location VARCHAR(150) DEFAULT 'India',
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
    status account_status_enum DEFAULT 'ACTIVE',
    assigned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.aggregators (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    yard_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    operating_area VARCHAR(150),
    operating_pincodes VARCHAR(10)[] DEFAULT '{}',
    materials_handled TEXT[] DEFAULT '{"CRT_DISPLAY", "PCB_ASSEMBLY", "LI_BATTERY", "CABLES_WIRES"}',
    location GEOGRAPHY(Point, 4326) NOT NULL,
    storage_capacity_sqft NUMERIC(10, 2) DEFAULT 500.0,
    is_formalized_partner BOOLEAN DEFAULT false,
    verification_status account_status_enum DEFAULT 'PENDING',
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_collections_handled INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collectors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    aggregator_id UUID REFERENCES public.aggregators(id) ON DELETE SET NULL,
    vehicle_type VARCHAR(50) DEFAULT 'BICYCLE' CHECK (vehicle_type IN ('BICYCLE', 'MOTORCYCLE', 'AUTO_RICKSHAW', 'MINI_TRUCK', 'ON_FOOT')),
    vehicle_registration_no VARCHAR(30),
    operating_area VARCHAR(150),
    current_location GEOGRAPHY(Point, 4326),
    service_radius_km NUMERIC(5, 2) DEFAULT 10.00,
    is_available BOOLEAN DEFAULT true,
    verification_status account_status_enum DEFAULT 'PENDING',
    active_jobs_count INT DEFAULT 0,
    completion_rate NUMERIC(5, 2) DEFAULT 100.00,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_pickups_completed INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recyclers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    facility_address TEXT NOT NULL,
    facility_location VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    cpcb_authorization_number VARCHAR(100) UNIQUE NOT NULL,
    cpcb_valid_upto DATE NOT NULL,
    is_cpcb_authorized BOOLEAN DEFAULT true,
    authorization_status VARCHAR(50) DEFAULT 'SUBMITTED_FOR_VERIFICATION',
    verification_status account_status_enum DEFAULT 'PENDING',
    authorized_schedule_codes TEXT[] DEFAULT '{"ITEW1", "ITEW2", "CEEW1", "CEEW2"}',
    annual_capacity_metric_tons NUMERIC(12, 2) NOT NULL DEFAULT 5000.0,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    compliance_score NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.material_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_names JSONB NOT NULL DEFAULT '{"en": "Category", "hi": "श्रेणी", "mr": "प्रवर्ग"}',
    is_hazardous BOOLEAN DEFAULT false,
    cpcb_schedule_code VARCHAR(50),
    icon_name VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.materials (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES public.material_categories(id) ON DELETE CASCADE,
    code VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    display_names JSONB NOT NULL DEFAULT '{"en": "Material", "hi": "सामग्री", "mr": "साहित्य"}',
    hazardous BOOLEAN DEFAULT false,
    unit VARCHAR(20) DEFAULT 'kg',
    base_price_per_kg NUMERIC(10, 2) DEFAULT 0.00,
    average_unit_weight_kg NUMERIC(8, 2) DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS lot_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_lot_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lot_code IS NULL OR NEW.lot_code = '' THEN
        NEW.lot_code := 'EW-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('lot_code_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.material_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_code VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    category_id INT REFERENCES public.material_categories(id) ON DELETE RESTRICT,
    material_id INT REFERENCES public.materials(id) ON DELETE RESTRICT,
    description TEXT,
    condition VARCHAR(30) DEFAULT 'INTACT' CHECK (condition IN ('INTACT', 'PARTIAL_DISASSEMBLED', 'DAMAGED_CRUSHED', 'SCRAP_BURNT')),
    estimated_weight_kg NUMERIC(8, 2),
    verified_weight_kg NUMERIC(8, 2),
    pickup_address TEXT NOT NULL,
    pickup_pincode VARCHAR(10),
    pickup_location GEOGRAPHY(Point, 4326) NOT NULL,
    status lot_status_enum NOT NULL DEFAULT 'CREATED',
    ai_estimated_min_value NUMERIC(10, 2),
    ai_estimated_max_value NUMERIC(10, 2),
    agreed_purchase_price NUMERIC(10, 2),
    final_recycler_price NUMERIC(10, 2),
    assigned_aggregator_id UUID REFERENCES public.aggregators(id) ON DELETE SET NULL,
    assigned_collector_id UUID REFERENCES public.collectors(id) ON DELETE SET NULL,
    matched_recycler_id UUID REFERENCES public.recyclers(id) ON DELETE SET NULL,
    pickup_otp VARCHAR(6),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS trigger_generate_lot_code ON public.material_lots;
CREATE TRIGGER trigger_generate_lot_code
BEFORE INSERT ON public.material_lots
FOR EACH ROW
EXECUTE FUNCTION generate_lot_code();

CREATE TABLE IF NOT EXISTS public.lot_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL CHECK (stage IN ('USER_UPLOAD', 'COLLECTOR_VERIFICATION', 'AGGREGATOR_INTAKE', 'RECYCLER_RECEIPT')),
    storage_path TEXT NOT NULL,
    captured_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    captured_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.price_records (
    id BIGSERIAL PRIMARY KEY,
    lot_id UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
    category_id INT REFERENCES public.material_categories(id) ON DELETE RESTRICT,
    material_id INT REFERENCES public.materials(id) ON DELETE SET NULL,
    location_district VARCHAR(100),
    price_per_kg NUMERIC(10, 2) NOT NULL,
    price_type VARCHAR(30) NOT NULL CHECK (price_type IN ('AI_ESTIMATE', 'AGGREGATOR_OFFER', 'COLLECTOR_PAYOUT', 'RECYCLER_PURCHASE')),
    recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collector_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    collector_id UUID NOT NULL REFERENCES public.collectors(id) ON DELETE CASCADE,
    assigned_by_aggregator_id UUID REFERENCES public.aggregators(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'OFFERED' CHECK (status IN ('OFFERED', 'ACCEPTED', 'REJECTED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED')),
    payout_amount NUMERIC(10, 2) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.recycler_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    recycler_id UUID NOT NULL REFERENCES public.recyclers(id) ON DELETE CASCADE,
    offered_rate_per_kg NUMERIC(10, 2) NOT NULL,
    total_quote_value NUMERIC(12, 2) NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE RESTRICT,
    payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(40) NOT NULL CHECK (transaction_type IN ('AGGREGATOR_TO_USER', 'AGGREGATOR_TO_COLLECTOR', 'RECYCLER_TO_AGGREGATOR', 'PLATFORM_FEE')),
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'NEFT_RTGS')),
    external_reference_id VARCHAR(100),
    status VARCHAR(30) DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'SETTLED', 'DISPUTED', 'REFUNDED')),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(30) NOT NULL CHECK (method IN ('CASH', 'UPI', 'NEFT_RTGS')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    gateway_order_id VARCHAR(100),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.earnings_ledger (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('CREDIT', 'DEBIT')),
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_lot_id UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
    reference_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.traceability_events (
    id BIGSERIAL PRIMARY KEY,
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    from_status VARCHAR(40),
    to_status VARCHAR(40),
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    actor_role VARCHAR(50) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    signature_hash VARCHAR(128) NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel VARCHAR(20) DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'SMS', 'WEB_PUSH', 'WHATSAPP')),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.safety_guidance (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES public.material_categories(id) ON DELETE CASCADE,
    hazard_level VARCHAR(20) DEFAULT 'LOW' CHECK (hazard_level IN ('LOW', 'MEDIUM', 'HIGH', 'SEVERE_CRITICAL')),
    title JSONB NOT NULL,
    do_instructions JSONB NOT NULL,
    dont_instructions JSONB NOT NULL,
    audio_url TEXT,
    icon_asset_key VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
    filed_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    against_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('WEIGHT_DISCREPANCY', 'PRICE_REFUSAL', 'DAMAGE_OR_SPILL', 'MISBEHAVIOR', 'OTHER')),
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED')),
    description TEXT NOT NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,
    predicted_category VARCHAR(80) NOT NULL,
    predicted_material VARCHAR(80),
    confidence_score NUMERIC(5, 4) NOT NULL,
    raw_classification JSONB,
    suggested_weight_kg NUMERIC(8, 2),
    suggested_min_price NUMERIC(10, 2),
    suggested_max_price NUMERIC(10, 2),
    user_corrected BOOLEAN DEFAULT false,
    user_corrected_category VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    detector_type VARCHAR(50) NOT NULL CHECK (detector_type IN ('PRICE_OUTLIER', 'WEIGHT_MISMATCH', 'HAZARDOUS_MISHANDLING', 'SUSPICIOUS_VELOCITY')),
    expected_value_range JSONB,
    actual_value JSONB,
    deviation_percentage NUMERIC(6, 2),
    reason TEXT NOT NULL,
    is_reviewed_by_admin BOOLEAN DEFAULT false,
    admin_action_taken VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    lot_id UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Seed Roles
INSERT INTO public.roles (name, description)
VALUES 
    ('USER', 'Citizen or consumer who generates e-waste and requests pickups'),
    ('INFORMAL_AGGREGATOR', 'Scrap godown/yard manager who coordinates collection, pricing, and formal sales'),
    ('COLLECTION_COLLECTOR', 'Field collector / kabadiwala who conducts pickups, weighing, and physical handovers'),
    ('AUTHORIZED_RECYCLER', 'CPCB/SPCB certified formal recycling and dismantling facility'),
    ('GOVERNMENT_ADMIN', 'Central/State pollution control board or municipal regulatory administrator')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 5. Helper Functions
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

-- 6. Trigger on auth.users for safe profile creation & approval requirements
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_role_name VARCHAR;
    assigned_role_name VARCHAR;
    target_role_id INT;
    initial_status account_status_enum;
BEGIN
    requested_role_name := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'USER'));

    -- Block public admin registration attempt
    IF requested_role_name = 'GOVERNMENT_ADMIN' THEN
        assigned_role_name := 'USER';
        initial_status := 'ACTIVE';
    ELSIF requested_role_name IN ('INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER') THEN
        assigned_role_name := requested_role_name;
        initial_status := 'PENDING';
    ELSE
        assigned_role_name := 'USER';
        initial_status := 'ACTIVE';
    END IF;

    INSERT INTO public.profiles (
        id, phone, email, role, full_name, preferred_language, avatar_url, account_status, general_location, is_active, is_verified
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

    SELECT id INTO target_role_id FROM public.roles WHERE name = assigned_role_name;
    IF target_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, status)
        VALUES (NEW.id, target_role_id, initial_status)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Seed Initial Taxonomy
INSERT INTO public.material_categories (code, name, display_names, is_hazardous, cpcb_schedule_code, icon_name, description)
VALUES
    ('CRT_DISPLAY', 'Cathode Ray Tube (CRT)', '{"en": "CRT Monitors & TVs", "hi": "सीआरटी मॉनिटर और टीवी", "mr": "सीआरटी मॉनिटर्स आणि टीव्ही"}', true, 'CEEW1', 'Tv', 'Leaded funnel glass & hazardous phosphors'),
    ('FLAT_DISPLAY', 'LCD / LED Flat Panel Display', '{"en": "LCD/LED Screens", "hi": "एलसीडी/एलईडी स्क्रीन", "mr": "एलसीडी/एलईडी स्क्रीन"}', true, 'CEEW1', 'Monitor', 'Mercury CCFL backlights & indium tin oxide'),
    ('PCB_ASSEMBLY', 'Printed Circuit Boards (PCB)', '{"en": "Circuit Boards / Motherboards", "hi": "सर्किट बोर्ड / मदरबोर्ड", "mr": "सर्किट बोर्ड / मदरबोर्ड"}', false, 'ITEW1', 'Cpu', 'Valuable copper, silver, and gold content'),
    ('LI_BATTERY', 'Lithium-Ion / Lead Acid Battery', '{"en": "Batteries", "hi": "बैटरी", "mr": "बॅटऱ्या"}', true, 'ITEW2', 'BatteryCharging', 'Rechargeable hazardous energy cells'),
    ('CABLES_WIRES', 'Cables & Wiring Harnesses', '{"en": "Cables & Wiring", "hi": "तार और केबल", "mr": "वायर आणि केबल्स"}', false, 'ITEW1', 'Cable', 'Insulated copper and aluminum electrical conduits'),
    ('COOLING_APPLIANCE', 'Refrigerators & Air Conditioners', '{"en": "Cooling Appliances", "hi": "फ्रिज और एयर कंडीशनर", "mr": "रेफ्रिजरेटर आणि एसी"}', true, 'CEEW2', 'Wind', 'Compressor-bearing white goods with ozone refrigerants'),
    ('MIXED_PLASTICS', 'Electronics Plastic Housing', '{"en": "E-Waste Mixed Plastics", "hi": "मिश्रित प्लास्टिक आवरण", "mr": "मिश्रित प्लास्टिक"}', false, 'CEEW1', 'Layers', 'ABS/HIPS/Polycarbonate flame-retarded plastics')
ON CONFLICT (code) DO NOTHING;
