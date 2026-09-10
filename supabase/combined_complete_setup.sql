-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - DATABASE SCHEMA
-- MIGRATION 01: INITIAL SCHEMA & TABLE DEFINITIONS
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Master user table extending auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN (
        'USER', 
        'INFORMAL_AGGREGATOR', 
        'COLLECTION_COLLECTOR', 
        'AUTHORIZED_RECYCLER', 
        'GOVERNMENT_ADMIN'
    )),
    full_name VARCHAR(150) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr', 'ta', 'te', 'kn', 'bn')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. USER_PROFILES (Citizen / Consumer specific metadata)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_type VARCHAR(30) DEFAULT 'INDIVIDUAL' CHECK (user_type IN ('INDIVIDUAL', 'BULK_CONSUMER', 'INSTITUTION', 'COMMERCIAL')),
    address_line TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    location GEOGRAPHY(Point, 4326),
    reward_points INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. AGGREGATORS (Informal scrap godowns / local yards)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aggregators (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    yard_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    operating_pincodes VARCHAR(10)[] DEFAULT '{}',
    location GEOGRAPHY(Point, 4326) NOT NULL,
    storage_capacity_sqft NUMERIC(10, 2) DEFAULT 500.0,
    is_formalized_partner BOOLEAN DEFAULT false,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_collections_handled INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. COLLECTORS (Field kabadiwalas & logistics agents)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collectors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    aggregator_id UUID REFERENCES public.aggregators(id) ON DELETE SET NULL,
    vehicle_type VARCHAR(50) DEFAULT 'BICYCLE' CHECK (vehicle_type IN ('BICYCLE', 'MOTORCYCLE', 'AUTO_RICKSHAW', 'MINI_TRUCK', 'ON_FOOT')),
    vehicle_registration_no VARCHAR(30),
    current_location GEOGRAPHY(Point, 4326),
    service_radius_km NUMERIC(5, 2) DEFAULT 10.00,
    is_available BOOLEAN DEFAULT true,
    active_jobs_count INT DEFAULT 0,
    completion_rate NUMERIC(5, 2) DEFAULT 100.00,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_pickups_completed INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. RECYCLERS (Authorized formal recycling facilities)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recyclers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    facility_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    cpcb_authorization_number VARCHAR(100) UNIQUE NOT NULL,
    cpcb_valid_upto DATE NOT NULL,
    is_cpcb_authorized BOOLEAN DEFAULT true,
    authorized_schedule_codes TEXT[] DEFAULT '{"ITEW1", "ITEW2", "CEEW1", "CEEW2"}',
    annual_capacity_metric_tons NUMERIC(12, 2) NOT NULL DEFAULT 5000.0,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    compliance_score NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. MATERIAL_CATEGORIES (Top-level e-waste classification taxonomy)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_names JSONB NOT NULL DEFAULT '{"en": "Category", "hi": "à¤¶à¥à¤°à¥‡à¤£à¥€", "mr": "à¤ªà¥à¤°à¤µà¤°à¥à¤—"}',
    is_hazardous BOOLEAN DEFAULT false,
    cpcb_schedule_code VARCHAR(50),
    icon_name VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. MATERIAL_SUBTYPES (Specific device & component classes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_subtypes (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES public.material_categories(id) ON DELETE CASCADE,
    code VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    display_names JSONB NOT NULL DEFAULT '{"en": "Subtype", "hi": "à¤‰à¤ªà¤ªà¥à¤°à¤•à¤¾à¤°", "mr": "à¤‰à¤ªà¤ªà¥à¤°à¤•à¤¾à¤°"}',
    default_density_kg_m3 NUMERIC(8, 2),
    average_unit_weight_kg NUMERIC(8, 2) DEFAULT 1.0,
    recyclable_materials JSONB DEFAULT '["copper", "plastics", "aluminum"]',
    hazardous_components JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. COMMODITY_INDEXES (Global & domestic scrap market spot rates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commodity_indexes (
    id SERIAL PRIMARY KEY,
    commodity VARCHAR(50) NOT NULL, -- 'COPPER_SCRAP', 'ALUMINUM_SCRAP', 'GOLD_INDEX', 'MIXED_PLASTIC'
    price_per_kg_inr NUMERIC(10, 2) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(100) DEFAULT 'MCX_INDIA',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(commodity, effective_date)
);

-- ------------------------------------------------------------------------------
-- 9. MATERIAL_LOTS (Central lifecycle entity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_code VARCHAR(30) UNIQUE NOT NULL, -- EW-YYYY-XXXXXX
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    category_id INT REFERENCES public.material_categories(id) ON DELETE RESTRICT,
    subtype_id INT REFERENCES public.material_subtypes(id) ON DELETE RESTRICT,
    description TEXT,
    condition VARCHAR(30) DEFAULT 'INTACT' CHECK (condition IN ('INTACT', 'PARTIAL_DISASSEMBLED', 'DAMAGED_CRUSHED', 'SCRAP_BURNT')),
    estimated_weight_kg NUMERIC(8, 2),
    verified_weight_kg NUMERIC(8, 2),
    pickup_address TEXT NOT NULL,
    pickup_pincode VARCHAR(10),
    pickup_location GEOGRAPHY(Point, 4326) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'CREATED' CHECK (status IN (
        'CREATED',
        'AI_ANALYZED',
        'AGGREGATOR_REVIEW',
        'COLLECTOR_ASSIGNED',
        'COLLECTOR_ACCEPTED',
        'ON_THE_WAY',
        'ARRIVED',
        'MATERIAL_VERIFIED',
        'COLLECTED',
        'AT_AGGREGATOR',
        'RECYCLER_MATCHED',
        'QUOTE_ACCEPTED',
        'HANDOVER_PENDING',
        'HANDOVER_COMPLETED',
        'PAYMENT_SETTLED',
        'COMPLETED',
        'CANCELLED',
        'DISPUTED',
        'FLAGGED',
        'REJECTED'
    )),
    ai_estimated_min_value NUMERIC(10, 2),
    ai_estimated_max_value NUMERIC(10, 2),
    agreed_purchase_price NUMERIC(10, 2),
    final_recycler_price NUMERIC(10, 2),
    assigned_aggregator_id UUID REFERENCES public.aggregators(id) ON DELETE SET NULL,
    assigned_collector_id UUID REFERENCES public.collectors(id) ON DELETE SET NULL,
    matched_recycler_id UUID REFERENCES public.recyclers(id) ON DELETE SET NULL,
    pickup_otp VARCHAR(6), -- 4 or 6 digit verification PIN
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 10. LOT_IMAGES (Verification and computer vision image assets)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 11. AI_PREDICTIONS (Inference logs from Python microservice)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,
    predicted_category VARCHAR(80) NOT NULL,
    predicted_subtype VARCHAR(80),
    confidence_score NUMERIC(5, 4) NOT NULL,
    raw_classification JSONB,
    suggested_weight_kg NUMERIC(8, 2),
    suggested_min_price NUMERIC(10, 2),
    suggested_max_price NUMERIC(10, 2),
    user_corrected BOOLEAN DEFAULT false,
    user_corrected_category VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 12. PRICE_RECORDS (Micro-transaction price feed for intelligence calculations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_records (
    id BIGSERIAL PRIMARY KEY,
    lot_id UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
    category_id INT REFERENCES public.material_categories(id) ON DELETE RESTRICT,
    subtype_id INT REFERENCES public.material_subtypes(id) ON DELETE SET NULL,
    location_district VARCHAR(100),
    price_per_kg NUMERIC(10, 2) NOT NULL,
    price_type VARCHAR(30) NOT NULL CHECK (price_type IN ('AI_ESTIMATE', 'AGGREGATOR_OFFER', 'COLLECTOR_PAYOUT', 'RECYCLER_PURCHASE')),
    recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 13. COLLECTOR_ASSIGNMENTS (Job dispatch and route tracking)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 14. RECYCLER_QUOTES (B2B wholesale purchase bids)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 15. TRANSACTIONS (Financial settlements & escrow)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 16. TRACEABILITY_EVENTS (Cryptographic immutable audit chain)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.traceability_events (
    id BIGSERIAL PRIMARY KEY,
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    from_status VARCHAR(40),
    to_status VARCHAR(40),
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    actor_role VARCHAR(30) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    signature_hash VARCHAR(128) NOT NULL, -- SHA-256 (prev_hash + payload)
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 17. EARNINGS_LEDGER (Double-entry balance records for field workers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.earnings_ledger (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('CREDIT', 'DEBIT')),
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_lot_id UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 18. NOTIFICATIONS (Omnichannel alerts)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 19. SAFETY_GUIDELINES (Material hazard directives & vernacular audio)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safety_guidelines (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES public.material_categories(id) ON DELETE CASCADE,
    hazard_level VARCHAR(20) DEFAULT 'LOW' CHECK (hazard_level IN ('LOW', 'MEDIUM', 'HIGH', 'SEVERE_CRITICAL')),
    title JSONB NOT NULL,
    do_instructions JSONB NOT NULL,
    dont_instructions JSONB NOT NULL,
    audio_asset_path TEXT,
    icon_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 20. COMPLAINTS (Grievance and discrepancy mechanism)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 21. REVIEWS (Reputation and performance ratings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 22. ANOMALY_ALERTS (Automated AI/Rule fraud and hazard alerts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------------
-- 23. DIGITAL_MANIFESTS (Form 6 Hazardous & E-Waste Transfer Consignments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.digital_manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_number VARCHAR(60) UNIQUE NOT NULL, -- MAN-YYYY-XXXXXX
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    consignor_aggregator_id UUID NOT NULL REFERENCES public.aggregators(id) ON DELETE RESTRICT,
    transporter_collector_id UUID NOT NULL REFERENCES public.collectors(id) ON DELETE RESTRICT,
    consignee_recycler_id UUID NOT NULL REFERENCES public.recyclers(id) ON DELETE RESTRICT,
    cpcb_form6_data JSONB NOT NULL,
    digital_signatures JSONB DEFAULT '{}',
    is_cpcb_synced BOOLEAN DEFAULT false,
    status VARCHAR(30) DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'IN_TRANSIT', 'RECEIVED_AT_FACILITY', 'VERIFIED_AND_SIGNED')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 24. AUDIT_LOGS (System-wide non-repudiation audit table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE & GEOSPATIAL SEARCHES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_material_lots_status ON public.material_lots(status);
CREATE INDEX IF NOT EXISTS idx_material_lots_user_id ON public.material_lots(user_id);
CREATE INDEX IF NOT EXISTS idx_material_lots_aggregator_id ON public.material_lots(assigned_aggregator_id);
CREATE INDEX IF NOT EXISTS idx_material_lots_collector_id ON public.material_lots(assigned_collector_id);
CREATE INDEX IF NOT EXISTS idx_material_lots_recycler_id ON public.material_lots(matched_recycler_id);
CREATE INDEX IF NOT EXISTS idx_material_lots_location ON public.material_lots USING GIST(pickup_location);
CREATE INDEX IF NOT EXISTS idx_aggregators_location ON public.aggregators USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_collectors_location ON public.collectors USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_recyclers_location ON public.recyclers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_price_records_cat ON public.price_records(category_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_traceability_lot ON public.traceability_events(lot_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_anomaly_risk ON public.anomaly_alerts(risk_level, is_reviewed_by_admin);
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
        role,
        full_name,
        preferred_language,
        avatar_url,
        is_active,
        is_verified
    ) VALUES (
        NEW.id,
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', 'NA_' || SUBSTRING(NEW.id::TEXT, 1, 10)),
        NEW.email,
        assigned_role_name,
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
-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - SUPABASE STORAGE
-- MIGRATION 03: STORAGE BUCKETS & ACCESS POLICIES
-- ==============================================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('ewaste-images', 'ewaste-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('collection-proof', 'collection-proof', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('handover-proof', 'handover-proof', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('recycler-documents', 'recycler-documents', false, 15728640, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('safety-media', 'safety-media', true, 20971520, ARRAY['image/svg+xml', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'safety-media' (Publicly Accessible)
CREATE POLICY "Public read access for safety media"
ON storage.objects FOR SELECT
USING (bucket_id = 'safety-media');

CREATE POLICY "Admin write access for safety media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'safety-media' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'GOVERNMENT_ADMIN'
    )
);

-- 3. Storage Policies for 'ewaste-images'
CREATE POLICY "Users and Agents can upload ewaste images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'ewaste-images' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authorized parties can view ewaste images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'ewaste-images' AND
    auth.role() = 'authenticated'
);

-- 4. Storage Policies for 'collection-proof'
CREATE POLICY "Collectors and Aggregators upload collection proofs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'collection-proof' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authorized parties can view collection proof"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'collection-proof' AND
    auth.role() = 'authenticated'
);

-- 5. Storage Policies for 'handover-proof'
CREATE POLICY "Aggregators and Recyclers upload handover proof"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'handover-proof' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Authorized parties can view handover proof"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'handover-proof' AND
    auth.role() = 'authenticated'
);

-- 6. Storage Policies for 'recycler-documents'
CREATE POLICY "Recyclers and Admins upload recycler documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'recycler-documents' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Recyclers and Admins view recycler documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'recycler-documents' AND
    (
        auth.uid()::text = (storage.foldername(name))[1] OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'GOVERNMENT_ADMIN')
    )
);
-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - ROW LEVEL SECURITY (RLS)
-- MIGRATION 04: RLS POLICIES FOR ALL CORE TABLES
-- ==============================================================================

-- Enable RLS on core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traceability_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public profile reading for authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. ROLES & USER_ROLES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can read roles"
ON public.roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can read their own assigned roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN'));

-- ------------------------------------------------------------------------------
-- 3. MATERIAL CATEGORIES & MATERIALS & SAFETY (Public Reference Data)
-- ------------------------------------------------------------------------------
CREATE POLICY "Everyone can read categories"
ON public.material_categories FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Everyone can read materials"
ON public.materials FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Everyone can read safety guidance"
ON public.safety_guidance FOR SELECT
TO authenticated, anon
USING (true);

-- ------------------------------------------------------------------------------
-- 4. MATERIAL LOTS POLICIES
-- ------------------------------------------------------------------------------
-- SELECT
CREATE POLICY "Role-based material lot visibility"
ON public.material_lots FOR SELECT
TO authenticated
USING (
    -- User sees their own lots
    user_id = auth.uid()
    -- Assigned aggregator or any aggregator in available review phase
    OR (assigned_aggregator_id = auth.uid() OR (status = 'AGGREGATOR_REVIEW' AND public.has_role(auth.uid(), 'INFORMAL_AGGREGATOR')))
    -- Assigned collector
    OR assigned_collector_id = auth.uid()
    -- Matched recycler
    OR matched_recycler_id = auth.uid()
    -- Government Admin sees all
    OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
);

-- INSERT
CREATE POLICY "Users and Aggregators can create lots"
ON public.material_lots FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'INFORMAL_AGGREGATOR')
);

-- UPDATE
CREATE POLICY "Authorized participants can update lots"
ON public.material_lots FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR assigned_aggregator_id = auth.uid()
    OR assigned_collector_id = auth.uid()
    OR matched_recycler_id = auth.uid()
    OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
);

-- ------------------------------------------------------------------------------
-- 5. COLLECTOR ASSIGNMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Collectors see their own assignments"
ON public.collector_assignments FOR SELECT
TO authenticated
USING (
    collector_id = auth.uid()
    OR assigned_by_aggregator_id = auth.uid()
    OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
);

CREATE POLICY "Aggregators can assign collectors"
ON public.collector_assignments FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'INFORMAL_AGGREGATOR')
    OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
);

CREATE POLICY "Collectors can update job status"
ON public.collector_assignments FOR UPDATE
TO authenticated
USING (
    collector_id = auth.uid()
    OR assigned_by_aggregator_id = auth.uid()
    OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
);

-- ------------------------------------------------------------------------------
-- 6. RECYCLER QUOTES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Recyclers manage their quotes"
ON public.recycler_quotes FOR ALL
TO authenticated
USING (
    recycler_id = auth.uid()
    OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
    OR EXISTS (
        SELECT 1 FROM public.material_lots ml
        WHERE ml.id = lot_id AND ml.assigned_aggregator_id = auth.uid()
    )
);

-- ------------------------------------------------------------------------------
-- 7. TRANSACTIONS & PAYMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Involved parties can view transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
    payer_id = auth.uid()
    OR recipient_id = auth.uid()
    OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
);

CREATE POLICY "Involved parties can view payments"
ON public.payments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.id = transaction_id AND (t.payer_id = auth.uid() OR t.recipient_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
);

-- ------------------------------------------------------------------------------
-- 8. EARNINGS LEDGER POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users see their own ledger"
ON public.earnings_ledger FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'GOVERNMENT_ADMIN'));

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users access their notifications"
ON public.notifications FOR ALL
TO authenticated
USING (recipient_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 10. ANOMALY ALERTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins view all anomalies, Aggregators view their own"
ON public.anomaly_alerts FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'GOVERNMENT_ADMIN')
    OR EXISTS (
        SELECT 1 FROM public.material_lots ml
        WHERE ml.id = lot_id AND ml.assigned_aggregator_id = auth.uid()
    )
);

CREATE POLICY "Admins update anomalies"
ON public.anomaly_alerts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'GOVERNMENT_ADMIN'));

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Only Government Admin reads audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'GOVERNMENT_ADMIN'));

CREATE POLICY "System and Authenticated users write audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);
-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - SEED DATA
-- MIGRATION 05: REFERENCE CATEGORIES, MATERIALS, SAFETY & COMMODITIES
-- ==============================================================================

-- 1. MATERIAL CATEGORIES (CPCB E-Waste Schedule I mapping)
INSERT INTO public.material_categories (code, name, display_names, is_hazardous, cpcb_schedule_code, icon_name, description)
VALUES
    ('CRT_DISPLAY', 'Cathode Ray Tube (CRT)', '{"en": "CRT Monitors & TVs", "hi": "à¤¸à¥€à¤†à¤°à¤Ÿà¥€ à¤®à¥‰à¤¨à¤¿à¤Ÿà¤° à¤”à¤° à¤Ÿà¥€à¤µà¥€", "mr": "à¤¸à¥€à¤†à¤°à¤Ÿà¥€ à¤®à¥‰à¤¨à¤¿à¤Ÿà¤°à¥à¤¸ à¤†à¤£à¤¿ à¤Ÿà¥€à¤µà¥à¤¹à¥€"}', true, 'CEEW1', 'Tv', 'Contains leaded glass and hazardous phosphors requiring controlled vacuum suction'),
    ('FLAT_DISPLAY', 'LCD / LED Flat Panel Display', '{"en": "LCD/LED Screens", "hi": "à¤à¤²à¤¸à¥€à¤¡à¥€/à¤à¤²à¤ˆà¤¡à¥€ à¤¸à¥à¤•à¥à¤°à¥€à¤¨", "mr": "à¤à¤²à¤¸à¥€à¤¡à¥€/à¤à¤²à¤ˆà¤¡à¥€ à¤¸à¥à¤•à¥à¤°à¥€à¤¨"}', true, 'CEEW1', 'Monitor', 'Flat displays containing mercury cold-cathode lamps (CCFL) or indium tin oxide layers'),
    ('PCB_ASSEMBLY', 'Printed Circuit Boards (PCB)', '{"en": "Circuit Boards / Motherboards", "hi": "à¤¸à¤°à¥à¤•à¤¿à¤Ÿ à¤¬à¥‹à¤°à¥à¤¡ / à¤®à¤¦à¤°à¤¬à¥‹à¤°à¥à¤¡", "mr": "à¤¸à¤°à¥à¤•à¤¿à¤Ÿ à¤¬à¥‹à¤°à¥à¤¡ / à¤®à¤¦à¤°à¤¬à¥‹à¤°à¥à¤¡"}', false, 'ITEW1', 'Cpu', 'High, medium and low grade electronic circuit boards rich in copper, silver, and gold traces'),
    ('LI_BATTERY', 'Lithium-Ion / Lead Acid Battery', '{"en": "Batteries", "hi": "à¤¬à¥ˆà¤Ÿà¤°à¥€", "mr": "à¤¬à¥…à¤Ÿà¤±à¥à¤¯à¤¾"}', true, 'ITEW2', 'BatteryCharging', 'Rechargeable energy cells prone to thermal runaway and chemical acid spills'),
    ('CABLES_WIRES', 'Cables & Wiring Harnesses', '{"en": "Cables & Wiring", "hi": "à¤¤à¤¾à¤° à¤”à¤° à¤•à¥‡à¤¬à¤²", "mr": "à¤µà¤¾à¤¯à¤° à¤†à¤£à¤¿ à¤•à¥‡à¤¬à¤²à¥à¤¸"}', false, 'ITEW1', 'Cable', 'Insulated PVC/Rubber copper and aluminum electrical conduits'),
    ('COOLING_APPLIANCE', 'Refrigerators & Air Conditioners', '{"en": "Cooling Appliances", "hi": "à¤«à¥à¤°à¤¿à¤œ à¤”à¤° à¤à¤¯à¤° à¤•à¤‚à¤¡à¥€à¤¶à¤¨à¤°", "mr": "à¤°à¥‡à¤«à¥à¤°à¤¿à¤œà¤°à¥‡à¤Ÿà¤° à¤†à¤£à¤¿ à¤à¤¸à¥€"}', true, 'CEEW2', 'Wind', 'Compressor-bearing white goods with ozone-depleting refrigerants (CFC/HFC) and oils'),
    ('MIXED_PLASTICS', 'Electronics Plastic Housing', '{"en": "E-Waste Mixed Plastics", "hi": "à¤®à¤¿à¤¶à¥à¤°à¤¿à¤¤ à¤ªà¥à¤²à¤¾à¤¸à¥à¤Ÿà¤¿à¤• à¤†à¤µà¤°à¤£", "mr": "à¤®à¤¿à¤¶à¥à¤°à¤¿à¤¤ à¤ªà¥à¤²à¤¾à¤¸à¥à¤Ÿà¤¿à¤•"}', false, 'CEEW1', 'Layers', 'Flame-retarded ABS/HIPS/Polycarbonate engineering plastics')
ON CONFLICT (code) DO NOTHING;

-- 2. MATERIALS
INSERT INTO public.materials (category_id, code, name, display_names, hazardous, unit, base_price_per_kg, average_unit_weight_kg, description)
VALUES
    (1, 'CRT_TV_21INCH', '21 Inch CRT Color Television', '{"en": "21\" CRT TV", "hi": "21 à¤‡à¤‚à¤š à¤¸à¥€à¤†à¤°à¤Ÿà¥€ à¤Ÿà¥€à¤µà¥€", "mr": "21 à¤‡à¤‚à¤š à¤¸à¥€à¤†à¤°à¤Ÿà¥€ à¤Ÿà¥€à¤µà¥à¤¹à¥€"}', true, 'unit', 350.00, 18.5, 'Complete boxed CRT television assembly'),
    (2, 'LCD_LAPTOP_SCREEN', 'Broken Laptop LCD Panel', '{"en": "Laptop Screen", "hi": "à¤²à¥ˆà¤ªà¤Ÿà¥‰à¤ª à¤¸à¥à¤•à¥à¤°à¥€à¤¨", "mr": "à¤²à¥…à¤ªà¤Ÿà¥‰à¤ª à¤¸à¥à¤•à¥à¤°à¥€à¤¨"}', false, 'unit', 180.00, 0.8, 'TFT LCD panel from notebook computer'),
    (3, 'HIGH_GRADE_MOTHERBOARD', 'High-Grade Desktop Motherboard', '{"en": "Computer Motherboard", "hi": "à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤®à¤¦à¤°à¤¬à¥‹à¤°à¥à¤¡", "mr": "à¤¸à¤‚à¤—à¤£à¤• à¤®à¤¦à¤°à¤¬à¥‹à¤°à¥à¤¡"}', false, 'kg', 420.00, 0.75, 'Gold pinned ATX motherboard socket'),
    (4, 'SMARTPHONE_LIBATTERY', 'Smartphone Li-Po Battery Cell', '{"en": "Phone Battery", "hi": "à¤«à¥‹à¤¨ à¤¬à¥ˆà¤Ÿà¤°à¥€", "mr": "à¤«à¥‹à¤¨ à¤¬à¥…à¤Ÿà¤°à¥€"}', true, 'unit', 45.00, 0.05, 'Lithium polymer 3.7V - 4.2V pouch cell'),
    (5, 'COPPER_HEAVY_CABLE', 'Stripped Copper Electrical Lead', '{"en": "Copper Wire Scrap", "hi": "à¤¤à¤¾à¤‚à¤¬à¥‡ à¤•à¤¾ à¤¤à¤¾à¤°", "mr": "à¤¤à¤¾à¤‚à¤¬à¥à¤¯à¤¾à¤šà¥€ à¤µà¤¾à¤¯à¤°"}', false, 'kg', 580.00, 1.0, 'Clean insulated copper conductors'),
    (6, 'ROTARY_COMPRESSOR', 'Hermetic Refrigerator Compressor', '{"en": "Fridge Compressor", "hi": "à¤«à¥à¤°à¤¿à¤œ à¤•à¤‚à¤ªà¥à¤°à¥‡à¤¸à¤°", "mr": "à¤«à¥à¤°à¤¿à¤œ à¤•à¥‰à¤®à¥à¤ªà¥à¤°à¥‡à¤¸à¤°"}', true, 'unit', 650.00, 8.5, 'Sealed compressor pump with copper coil windings'),
    (7, 'ABS_PC_CHASSIS', 'Whitegoods ABS/PC Shell Scrap', '{"en": "Appliance Plastic Shell", "hi": "à¤‰à¤ªà¤•à¤°à¤£ à¤ªà¥à¤²à¤¾à¤¸à¥à¤Ÿà¤¿à¤• à¤•à¥‡à¤¸à¤¿à¤‚à¤—", "mr": "à¤‰à¤ªà¤•à¤°à¤£ à¤ªà¥à¤²à¤¾à¤¸à¥à¤Ÿà¤¿à¤•"}', false, 'kg', 28.00, 2.5, 'Clean shredded printer/monitor casing plastics')
ON CONFLICT (code) DO NOTHING;

-- 3. SAFETY GUIDANCE
INSERT INTO public.safety_guidance (category_id, hazard_level, title, do_instructions, dont_instructions, audio_url, icon_asset_key)
VALUES
    (1, 'SEVERE_CRITICAL', 
     '{"en": "CRT Vacuum & Leaded Glass Safety", "hi": "à¤¸à¥€à¤†à¤°à¤Ÿà¥€ à¤µà¥ˆà¤•à¥à¤¯à¥‚à¤® à¤”à¤° à¤²à¥‡à¤¡à¥‡à¤¡ à¤—à¥à¤²à¤¾à¤¸ à¤¸à¥à¤°à¤•à¥à¤·à¤¾", "mr": "à¤¸à¥€à¤†à¤°à¤Ÿà¥€ à¤µà¥à¤¹à¥…à¤•à¥à¤¯à¥‚à¤® à¤†à¤£à¤¿ à¤²à¥‡à¤¡à¥‡à¤¡ à¤—à¥à¤²à¤¾à¤¸ à¤¸à¥à¤°à¤•à¥à¤·à¤¾"}',
     '{"en": ["Wear heavy leather gloves and shatterproof goggles", "Keep screen face down on cushioned surface", "Keep intact without crushing neck funnel"], "hi": ["à¤®à¥‹à¤Ÿà¥‡ à¤šà¤®à¤¡à¤¼à¥‡ à¤•à¥‡ à¤¦à¤¸à¥à¤¤à¤¾à¤¨à¥‡ à¤”à¤° à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤šà¤¶à¥à¤®à¤¾ à¤ªà¤¹à¤¨à¥‡à¤‚", "à¤¸à¥à¤•à¥à¤°à¥€à¤¨ à¤•à¥‹ à¤—à¤¦à¥à¤¦à¥‡à¤¦à¤¾à¤° à¤¸à¤¤à¤¹ à¤ªà¤° à¤¨à¥€à¤šà¥‡ à¤•à¥€ à¤“à¤° à¤°à¤–à¥‡à¤‚", "à¤«à¤¨à¤² à¤•à¥‹ à¤¬à¤¿à¤¨à¤¾ à¤¤à¥‹à¤¡à¤¼à¥‡ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤°à¤–à¥‡à¤‚"]}',
     '{"en": ["DO NOT strike the glass neck with hammers", "DO NOT dismantle in open residential areas", "DO NOT expose phosphor dust"], "hi": ["à¤•à¤¾à¤‚à¤š à¤•à¥€ à¤—à¤°à¥à¤¦à¤¨ à¤ªà¤° à¤¹à¤¥à¥Œà¤¡à¤¼à¥‡ à¤¸à¥‡ à¤µà¤¾à¤° à¤¨ à¤•à¤°à¥‡à¤‚", "à¤–à¥à¤²à¥‡ à¤†à¤µà¤¾à¤¸à¥€à¤¯ à¤•à¥à¤·à¥‡à¤¤à¥à¤°à¥‹à¤‚ à¤®à¥‡à¤‚ à¤¨ à¤¤à¥‹à¤¡à¤¼à¥‡à¤‚", "à¤«à¥‰à¤¸à¥à¤«à¤° à¤ªà¤¾à¤‰à¤¡à¤° à¤•à¥‹ à¤¹à¤µà¤¾ à¤®à¥‡à¤‚ à¤¨ à¤‰à¤¡à¤¼à¤¨à¥‡ à¤¦à¥‡à¤‚"]}',
     'https://cdn.ewaste.gov.in/safety/crt_safety_hi.mp3',
     'AlertTriangle'
    ),
    (4, 'HIGH',
     '{"en": "Lithium Battery Fire & Acid Prevention", "hi": "à¤²à¤¿à¤¥à¤¿à¤¯à¤® à¤¬à¥ˆà¤Ÿà¤°à¥€ à¤†à¤— à¤”à¤° à¤à¤¸à¤¿à¤¡ à¤°à¥‹à¤•à¤¥à¤¾à¤®", "mr": "à¤²à¤¿à¤¥à¤¿à¤¯à¤® à¤¬à¥…à¤Ÿà¤°à¥€ à¤†à¤— à¤†à¤£à¤¿ à¤à¤¸à¤¿à¤¡ à¤ªà¥à¤°à¤¤à¤¿à¤¬à¤‚à¤§"}',
     '{"en": ["Tape over exposed copper contacts with insulation tape", "Store in non-conductive dry sand buckets", "Keep fire extinguisher rated for Class D/Chemicals nearby"], "hi": ["à¤–à¥à¤²à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤•à¥‹à¤‚ à¤•à¥‹ à¤‡à¤‚à¤¸à¥à¤²à¥‡à¤¶à¤¨ à¤Ÿà¥‡à¤ª à¤¸à¥‡ à¤¢à¤• à¤¦à¥‡à¤‚", "à¤¸à¥‚à¤–à¥€ à¤°à¥‡à¤¤ à¤•à¥€ à¤¬à¤¾à¤²à¥à¤Ÿà¥€ à¤®à¥‡à¤‚ à¤°à¤–à¥‡à¤‚", "à¤ªà¤¾à¤¸ à¤®à¥‡à¤‚ à¤¸à¥‚à¤–à¤¾ à¤…à¤—à¥à¤¨à¤¿à¤¶à¤¾à¤®à¤• à¤°à¤–à¥‡à¤‚"]}',
     '{"en": ["DO NOT puncture swollen battery packs", "DO NOT submerge in water", "DO NOT burn in open scrap heaps"], "hi": ["à¤¸à¥‚à¤œà¥€ à¤¹à¥à¤ˆ à¤¬à¥ˆà¤Ÿà¤°à¥€ à¤•à¥‹ à¤¨ à¤›à¥‡à¤¦à¥‡à¤‚", "à¤ªà¤¾à¤¨à¥€ à¤®à¥‡à¤‚ à¤¨ à¤¡à¥à¤¬à¥‹à¤à¤‚", "à¤•à¤šà¤°à¥‡ à¤•à¥‡ à¤¢à¥‡à¤° à¤®à¥‡à¤‚ à¤†à¤— à¤¨ à¤²à¤—à¤¾à¤à¤‚"]}',
     'https://cdn.ewaste.gov.in/safety/battery_safety_hi.mp3',
     'Flame'
    )
ON CONFLICT DO NOTHING;
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
-- ==============================================================================
-- STEP 4: USER E-WASTE LOT CREATION & CLASSIFICATION SCHEMA
-- Migration: 07_step4_user_lot_creation_schema.sql
-- ==============================================================================

-- 1. Ensure lot_status_enum contains initial citizen workflow statuses
DO $$ BEGIN
    ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'DRAFT';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'AI_ANALYZED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'WAITING_FOR_QUOTE';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Extend public.material_lots with Step 4 disposal fields
ALTER TABLE public.material_lots
ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS ai_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS ai_subcategory VARCHAR(100),
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(4, 3),
ADD COLUMN IF NOT EXISTS user_confirmed_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS estimated_min_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS estimated_max_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS valuation_currency VARCHAR(10) DEFAULT 'INR';

-- 3. Extend public.lot_images with file metadata
ALTER TABLE public.lot_images
ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255),
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS file_size INT,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 4. Seed Comprehensive Database-Driven Material Categories & Subcategories
-- Categories Table extension for parent-child if applicable
ALTER TABLE public.material_categories
ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES public.material_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS example_items TEXT[] DEFAULT '{}';

-- Upsert Top-Level Categories
INSERT INTO public.material_categories (id, code, name, display_names, is_hazardous, icon_name, description)
VALUES
    (10, 'CONSUMER_ELECTRONICS', 'Consumer Electronics & Computing', 
     '{"en": "Consumer Electronics & Computing", "hi": "à¤‰à¤ªà¤­à¥‹à¤•à¥à¤¤à¤¾ à¤‡à¤²à¥‡à¤•à¥à¤Ÿà¥à¤°à¥‰à¤¨à¤¿à¤•à¥à¤¸ à¤”à¤° à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤¿à¤‚à¤—", "mr": "à¤—à¥à¤°à¤¾à¤¹à¤• à¤‡à¤²à¥‡à¤•à¥à¤Ÿà¥à¤°à¥‰à¤¨à¤¿à¤•à¥à¤¸ à¤†à¤£à¤¿ à¤¸à¤‚à¤—à¤£à¤•"}', 
     false, 'Laptop', 'Laptops, desktops, smartphones, tablets, and personal computing devices'),
    (20, 'LARGE_APPLIANCES', 'Large White Goods & Appliances', 
     '{"en": "Large White Goods & Appliances", "hi": "à¤¬à¤¡à¤¼à¥‡ à¤˜à¤°à¥‡à¤²à¥‚ à¤‰à¤ªà¤•à¤°à¤£ (à¤«à¥à¤°à¤¿à¤œ, à¤à¤¸à¥€, à¤µà¤¾à¤¶à¤¿à¤‚à¤— à¤®à¤¶à¥€à¤¨)", "mr": "à¤®à¥‹à¤ à¥€ à¤˜à¤°à¤—à¥à¤¤à¥€ à¤‰à¤ªà¤•à¤°à¤£à¥‡ (à¤«à¥à¤°à¤¿à¤œ, à¤µà¥‰à¤¶à¤¿à¤‚à¤— à¤®à¤¶à¥€à¤¨)"}', 
     true, 'Refrigerator', 'Refrigerators, washing machines, air conditioners containing refrigerants and compressors'),
    (30, 'DISPLAYS_SCREENS', 'Displays, Monitors & Televisions', 
     '{"en": "Displays, Monitors & Televisions", "hi": "à¤Ÿà¥‡à¤²à¥€à¤µà¤¿à¤œà¤¨, à¤®à¥‰à¤¨à¤¿à¤Ÿà¤° à¤”à¤° à¤¡à¤¿à¤¸à¥à¤ªà¥à¤²à¥‡ à¤¸à¥à¤•à¥à¤°à¥€à¤¨", "mr": "à¤Ÿà¥€à¤µà¥à¤¹à¥€, à¤®à¥‰à¤¨à¤¿à¤Ÿà¤° à¤†à¤£à¤¿ à¤¡à¤¿à¤¸à¥à¤ªà¥à¤²à¥‡ à¤¸à¥à¤•à¥à¤°à¥€à¤¨"}', 
     true, 'Tv', 'CRT TVs, flat panel LED/LCD monitors, laptops screens with mercury/phosphor content'),
    (40, 'ELECTRONIC_COMPONENTS', 'Batteries, PCBs & Circuit Boards', 
     '{"en": "Batteries, PCBs & Circuit Boards", "hi": "à¤¬à¥ˆà¤Ÿà¤°à¥€, à¤¸à¤°à¥à¤•à¤¿à¤Ÿ à¤¬à¥‹à¤°à¥à¤¡ à¤”à¤° à¤ªà¥à¤°à¥à¤œà¥‡", "mr": "à¤¬à¥…à¤Ÿà¤°à¥€, à¤¸à¤°à¥à¤•à¤¿à¤Ÿ à¤¬à¥‹à¤°à¥à¤¡ à¤†à¤£à¤¿ à¤¸à¥à¤Ÿà¥‡ à¤­à¤¾à¤—"}', 
     true, 'Cpu', 'Lithium-ion batteries, lead-acid batteries, power supply units, high-grade motherboards'),
    (50, 'PERIPHERALS_CABLES', 'Cables, Chargers & Small Accessories', 
     '{"en": "Cables, Chargers & Small Accessories", "hi": "à¤•à¥‡à¤¬à¤², à¤šà¤¾à¤°à¥à¤œà¤° à¤”à¤° à¤¸à¤¹à¤¾à¤¯à¤• à¤‰à¤ªà¤•à¤°à¤£", "mr": "à¤•à¥‡à¤¬à¤²à¥à¤¸, à¤šà¤¾à¤°à¥à¤œà¤° à¤†à¤£à¤¿ à¤…â€à¥…à¤•à¥à¤¸à¥‡à¤¸à¤°à¥€à¤œ"}', 
     false, 'Cable', 'Copper cables, wiring harnesses, AC power adapters, keyboards, mice, audio gear')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_names = EXCLUDED.display_names,
    icon_name = EXCLUDED.icon_name,
    description = EXCLUDED.description;

-- Upsert Specific Material Types & Subcategories
INSERT INTO public.materials (id, category_id, code, name, display_names, hazardous, unit, base_price_per_kg, average_unit_weight_kg)
VALUES
    -- Consumer Electronics (Cat 10)
    (101, 10, 'SMARTPHONE', 'Mobile Phone / Smartphone', 
     '{"en": "Mobile Phone / Smartphone", "hi": "à¤¸à¥à¤®à¤¾à¤°à¥à¤Ÿà¤«à¥‹à¤¨ / à¤®à¥‹à¤¬à¤¾à¤‡à¤²", "mr": "à¤®à¥‹à¤¬à¤¾à¤ˆà¤² à¤«à¥‹à¤¨ / à¤¸à¥à¤®à¤¾à¤°à¥à¤Ÿà¤«à¥‹à¤¨"}', 
     false, 'unit', 350.00, 0.18),
    (102, 10, 'LAPTOP_COMPUTER', 'Laptop Computer (Standard / Ultra)', 
     '{"en": "Laptop Computer", "hi": "à¤²à¥ˆà¤ªà¤Ÿà¥‰à¤ª à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤°", "mr": "à¤²à¥…à¤ªà¤Ÿà¥‰à¤ª à¤¸à¤‚à¤—à¤£à¤•"}', 
     false, 'unit', 1400.00, 2.20),
    (103, 10, 'DESKTOP_CPU_TOWER', 'Desktop Computer CPU Tower', 
     '{"en": "Desktop Computer Tower", "hi": "à¤¡à¥‡à¤¸à¥à¤•à¤Ÿà¥‰à¤ª à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤Ÿà¥‰à¤µà¤°", "mr": "à¤¡à¥‡à¤¸à¥à¤•à¤Ÿà¥‰à¤ª à¤•à¥‰à¤®à¥à¤ªà¥à¤¯à¥à¤Ÿà¤° à¤Ÿà¥‰à¤µà¤°"}', 
     false, 'unit', 950.00, 7.50),
    (104, 10, 'TABLET_IPAD', 'Tablet / iPad Device', 
     '{"en": "Tablet / iPad", "hi": "à¤Ÿà¥ˆà¤¬à¤²à¥‡à¤Ÿ / à¤†à¤ˆà¤ªà¥ˆà¤¡", "mr": "à¤Ÿà¥…à¤¬à¤²à¥‡à¤Ÿ / à¤†à¤¯à¤ªà¥…à¤¡"}', 
     false, 'unit', 600.00, 0.45),
    (105, 10, 'PRINTER_SCANNER', 'Home/Office Printer or Scanner', 
     '{"en": "Printer / Scanner", "hi": "à¤ªà¥à¤°à¤¿à¤‚à¤Ÿà¤° / à¤¸à¥à¤•à¥ˆà¤¨à¤°", "mr": "à¤ªà¥à¤°à¤¿à¤‚à¤Ÿà¤° / à¤¸à¥à¤•à¥…à¤¨à¤°"}', 
     false, 'unit', 400.00, 5.00),

    -- Large Appliances (Cat 20)
    (201, 20, 'REFRIGERATOR_SINGLE_DOOR', 'Single/Double Door Refrigerator', 
     '{"en": "Refrigerator", "hi": "à¤°à¥‡à¤«à¥à¤°à¤¿à¤œà¤°à¥‡à¤Ÿà¤° / à¤«à¥à¤°à¤¿à¤œ", "mr": "à¤«à¥à¤°à¤¿à¤œ / à¤°à¥‡à¤«à¥à¤°à¤¿à¤œà¤°à¥‡à¤Ÿà¤°"}', 
     true, 'unit', 1800.00, 38.00),
    (202, 20, 'WASHING_MACHINE', 'Washing Machine (Semi/Fully Automatic)', 
     '{"en": "Washing Machine", "hi": "à¤µà¤¾à¤¶à¤¿à¤‚à¤— à¤®à¤¶à¥€à¤¨", "mr": "à¤µà¥‰à¤¶à¤¿à¤‚à¤— à¤®à¤¶à¥€à¤¨"}', 
     false, 'unit', 1200.00, 28.00),
    (203, 20, 'AIR_CONDITIONER_SPLIT', 'Air Conditioner (Indoor/Outdoor Unit)', 
     '{"en": "Air Conditioner (Split/Window)", "hi": "à¤à¤¯à¤° à¤•à¤‚à¤¡à¥€à¤¶à¤¨à¤° (à¤à¤¸à¥€)", "mr": "à¤à¤…à¤° à¤•à¤‚à¤¡à¤¿à¤¶à¤¨à¤° (à¤à¤¸à¥€)"}', 
     true, 'unit', 2200.00, 32.00),

    -- Displays & Screens (Cat 30)
    (301, 30, 'LED_LCD_TV', 'Flat Panel LED/LCD Television', 
     '{"en": "Flat Screen LED/LCD TV", "hi": "à¤«à¥à¤²à¥ˆà¤Ÿ à¤¸à¥à¤•à¥à¤°à¥€à¤¨ à¤à¤²à¤ˆà¤¡à¥€ à¤Ÿà¥€à¤µà¥€", "mr": "à¤«à¥à¤²à¥…à¤Ÿ à¤¸à¥à¤•à¥à¤°à¥€à¤¨ à¤à¤²à¤ˆà¤¡à¥€ à¤Ÿà¥€à¤µà¥à¤¹à¥€"}', 
     false, 'unit', 850.00, 8.50),
    (302, 30, 'CRT_MONITOR_TV', 'CRT Monitor or Bulky Tube Television', 
     '{"en": "CRT Monitor / Tube TV", "hi": "à¤¸à¥€à¤†à¤°à¤Ÿà¥€ à¤®à¥‰à¤¨à¤¿à¤Ÿà¤° / à¤ªà¥à¤°à¤¾à¤¨à¤¾ à¤Ÿà¥€à¤µà¥€", "mr": "à¤¸à¥€à¤†à¤°à¤Ÿà¥€ à¤®à¥‰à¤¨à¤¿à¤Ÿà¤° / à¤œà¥à¤¨à¤¾ à¤Ÿà¥€à¤µà¥à¤¹à¥€"}', 
     true, 'unit', 300.00, 18.00),

    -- Components & Batteries (Cat 40)
    (401, 40, 'LI_ION_BATTERY_PACK', 'Lithium-Ion Battery Pack', 
     '{"en": "Lithium-Ion Battery", "hi": "à¤²à¤¿à¤¥à¤¿à¤¯à¤®-à¤†à¤¯à¤¨ à¤¬à¥ˆà¤Ÿà¤°à¥€", "mr": "à¤²à¤¿à¤¥à¤¿à¤¯à¤®-à¤†à¤¯à¤¨ à¤¬à¥…à¤Ÿà¤°à¥€"}', 
     true, 'kg', 85.00, 1.00),
    (402, 40, 'LEAD_ACID_UPS_BATTERY', 'Lead-Acid UPS Inverter Battery', 
     '{"en": "Inverter / UPS Lead-Acid Battery", "hi": "à¤‡à¤¨à¥à¤µà¤°à¥à¤Ÿà¤° / à¤¯à¥‚à¤ªà¥€à¤à¤¸ à¤¬à¥ˆà¤Ÿà¤°à¥€", "mr": "à¤‡à¤¨à¥à¤µà¥à¤¹à¤°à¥à¤Ÿà¤° à¤¬à¥…à¤Ÿà¤°à¥€"}', 
     true, 'kg', 95.00, 14.00),
    (403, 40, 'HIGH_GRADE_PCB', 'Motherboard / High-Grade PCB', 
     '{"en": "High-Grade Motherboard PCB", "hi": "à¤®à¤¦à¤°à¤¬à¥‹à¤°à¥à¤¡ à¤¸à¤°à¥à¤•à¤¿à¤Ÿ à¤¬à¥‹à¤°à¥à¤¡", "mr": "à¤®à¤¦à¤°à¤¬à¥‹à¤°à¥à¤¡ à¤¸à¤°à¥à¤•à¤¿à¤Ÿ à¤¬à¥‹à¤°à¥à¤¡"}', 
     false, 'kg', 420.00, 0.60),

    -- Peripherals & Cables (Cat 50)
    (501, 50, 'COPPER_CABLES_WIRES', 'Copper Electric Cables & Wires', 
     '{"en": "Copper Wiring & Cables", "hi": "à¤¤à¤¾à¤‚à¤¬à¥‡ à¤•à¥‡ à¤¤à¤¾à¤° à¤”à¤° à¤•à¥‡à¤¬à¤²", "mr": "à¤¤à¤¾à¤‚à¤¬à¥à¤¯à¤¾à¤šà¥à¤¯à¤¾ à¤¤à¤¾à¤°à¤¾ à¤†à¤£à¤¿ à¤•à¥‡à¤¬à¤²à¥à¤¸"}', 
     false, 'kg', 320.00, 1.00),
    (502, 50, 'CHARGERS_ADAPTERS', 'Mobile/Laptop Power Chargers', 
     '{"en": "Charger / Power Adapter", "hi": "à¤šà¤¾à¤°à¥à¤œà¤° à¤”à¤° à¤…à¤¡à¥ˆà¤ªà¥à¤Ÿà¤°", "mr": "à¤šà¤¾à¤°à¥à¤œà¤° à¤†à¤£à¤¿ à¤…â€à¥…à¤¡à¥‰à¤ªà¥à¤Ÿà¤°"}', 
     false, 'kg', 60.00, 0.25)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_names = EXCLUDED.display_names,
    base_price_per_kg = EXCLUDED.base_price_per_kg,
    average_unit_weight_kg = EXCLUDED.average_unit_weight_kg;

-- 5. Row Level Security Policies for Material Lots & Lot Images
ALTER TABLE public.material_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_images ENABLE ROW LEVEL SECURITY;

-- Citizens can only view and insert their own lots
DROP POLICY IF EXISTS "Users can view own material lots" ON public.material_lots;
CREATE POLICY "Users can view own material lots"
ON public.material_lots FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name IN ('GOVERNMENT_ADMIN', 'INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER')
));

DROP POLICY IF EXISTS "Users can insert own material lots" ON public.material_lots;
CREATE POLICY "Users can insert own material lots"
ON public.material_lots FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own uncollected material lots" ON public.material_lots;
CREATE POLICY "Users can update own uncollected material lots"
ON public.material_lots FOR UPDATE
USING (auth.uid() = user_id AND status IN ('CREATED', 'AI_ANALYZED', 'WAITING_FOR_QUOTE', 'DRAFT'));

-- Images policies
DROP POLICY IF EXISTS "Users can view images of accessible lots" ON public.lot_images;
CREATE POLICY "Users can view images of accessible lots"
ON public.lot_images FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.material_lots ml
    WHERE ml.id = lot_images.lot_id AND (
        ml.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('GOVERNMENT_ADMIN', 'INFORMAL_AGGREGATOR', 'COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER')
        )
    )
));

DROP POLICY IF EXISTS "Users can insert images for their own lots" ON public.lot_images;
CREATE POLICY "Users can insert images for their own lots"
ON public.lot_images FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.material_lots ml
    WHERE ml.id = lot_images.lot_id AND ml.user_id = auth.uid()
));

-- 6. Configure Storage Bucket for Lot Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('e-waste-lot-images', 'e-waste-lot-images', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('lot-images', 'lot-images', false)
ON CONFLICT (id) DO NOTHING;
-- Step 5: informal aggregator review, pricing, and quote workflow.
ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'AGGREGATOR_REVIEW';
ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'QUOTE_READY';

CREATE TABLE IF NOT EXISTS public.aggregator_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE RESTRICT,
  aggregator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  price_record_id UUID REFERENCES public.price_records(id) ON DELETE SET NULL,
  market_reference_value NUMERIC(12,2) NOT NULL,
  market_rate NUMERIC(12,2) NOT NULL,
  price_unit TEXT NOT NULL DEFAULT 'INR_PER_KG',
  base_material_value NUMERIC(12,2) NOT NULL,
  collection_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (collection_cost >= 0),
  handling_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (handling_cost >= 0),
  other_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (other_cost >= 0),
  margin_type TEXT NOT NULL CHECK (margin_type IN ('FIXED', 'PERCENTAGE')),
  margin_value NUMERIC(12,2) NOT NULL CHECK (margin_value >= 0),
  margin_amount NUMERIC(12,2) NOT NULL CHECK (margin_amount >= 0),
  recommended_price NUMERIC(12,2) NOT NULL CHECK (recommended_price >= 0),
  final_quote NUMERIC(12,2) NOT NULL CHECK (final_quote >= 0),
  price_confidence TEXT NOT NULL CHECK (price_confidence IN ('HIGH', 'MEDIUM', 'LOW', 'LIMITED')),
  pricing_method TEXT NOT NULL DEFAULT 'MARKET_RATE_WITH_COSTS',
  price_timestamp TIMESTAMPTZ,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','EXPIRED','CANCELLED')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lot_id, aggregator_id)
);

CREATE TABLE IF NOT EXISTS public.lot_review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
  aggregator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  material_verified BOOLEAN, category_verified BOOLEAN, weight_reviewed BOOLEAN,
  review_status TEXT NOT NULL DEFAULT 'IN_REVIEW' CHECK (review_status IN ('PENDING','IN_REVIEW','VERIFIED','REQUIRES_CORRECTION','REJECTED')),
  notes TEXT, reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.lot_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
  aggregator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  flag_type TEXT NOT NULL, notes TEXT, status TEXT NOT NULL DEFAULT 'OPEN', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aggregator_quotes_lot ON public.aggregator_quotes(lot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_lot ON public.lot_review_records(lot_id);

ALTER TABLE public.aggregator_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_review_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aggregators manage own quotes" ON public.aggregator_quotes FOR ALL USING (auth.uid() = aggregator_id) WITH CHECK (auth.uid() = aggregator_id);
CREATE POLICY "Aggregators manage own reviews" ON public.lot_review_records FOR ALL USING (auth.uid() = aggregator_id) WITH CHECK (auth.uid() = aggregator_id);
CREATE POLICY "Aggregators manage own flags" ON public.lot_flags FOR ALL USING (auth.uid() = aggregator_id) WITH CHECK (auth.uid() = aggregator_id);
