-- ==============================================================================
-- STEP 6: COMPLETE COLLECTION COLLECTOR WORKFLOW SCHEMA
-- Migration: 09_step6_collector_workflow.sql
-- ==============================================================================

-- 1. Ensure lot_status_enum has ARRIVED and COLLECTED
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lot_status_enum') THEN
        BEGIN ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'ARRIVED'; EXCEPTION WHEN duplicate_object THEN null; END;
        BEGIN ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'COLLECTED'; EXCEPTION WHEN duplicate_object THEN null; END;
    END IF;
END $$;

-- 2. Human-readable assignment sequence
CREATE SEQUENCE IF NOT EXISTS collector_assignment_code_seq START 1;

-- 3. Extend public.collectors with operational field parameters
ALTER TABLE public.collectors
ADD COLUMN IF NOT EXISTS availability VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (availability IN ('AVAILABLE', 'BUSY', 'OFFLINE')),
ADD COLUMN IF NOT EXISTS area VARCHAR(100) DEFAULT 'Central District',
ADD COLUMN IF NOT EXISTS district VARCHAR(100) DEFAULT 'Mumbai',
ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Maharashtra',
ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(5, 2) DEFAULT 95.00,
ADD COLUMN IF NOT EXISTS total_collected_weight_kg NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(12, 2) DEFAULT 0.00;

-- 4. Extend public.collector_assignments with lifecycle fields
ALTER TABLE public.collector_assignments
ADD COLUMN IF NOT EXISTS assignment_code VARCHAR(30) UNIQUE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS pickup_longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS estimated_weight NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS expected_amount NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS collector_earning NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS collector_notes TEXT,
ADD COLUMN IF NOT EXISTS aggregator_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Strict Concurrency Lock: Prevent multiple active assignments for the same lot
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_assignment_per_lot 
ON public.collector_assignments (lot_id) 
WHERE status NOT IN ('REJECTED', 'CANCELLED', 'EXPIRED');

-- 6. Table: Collection Verifications (Separate from AI prediction and user input)
CREATE TABLE IF NOT EXISTS public.collection_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.collector_assignments(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    collector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verified_material_id INT REFERENCES public.materials(id) ON DELETE SET NULL,
    verified_category_id INT REFERENCES public.material_categories(id) ON DELETE SET NULL,
    verified_category_name VARCHAR(100),
    condition VARCHAR(30) NOT NULL CHECK (condition IN ('WORKING', 'PARTIALLY_WORKING', 'NON_WORKING', 'DAMAGED', 'UNKNOWN')),
    verified_weight NUMERIC(10, 2) NOT NULL CHECK (verified_weight > 0),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    weighing_method VARCHAR(50) DEFAULT 'DIGITAL_SCALE',
    scale_reference VARCHAR(100),
    notes TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    verified_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Table: Collection Photos (Proof of scale, condition, and handover)
CREATE TABLE IF NOT EXISTS public.collection_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.collector_assignments(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES public.material_lots(id) ON DELETE CASCADE,
    collector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    photo_type VARCHAR(50) NOT NULL CHECK (photo_type IN ('MATERIAL', 'WEIGHING_SCALE', 'CONDITION', 'COLLECTION_PROOF')),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    captured_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Table: Event-driven Collector Locations (Audit trace, no continuous tracking)
CREATE TABLE IF NOT EXISTS public.collector_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.collector_assignments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('START', 'ARRIVED', 'VERIFIED', 'COLLECTED')),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    accuracy NUMERIC(8, 2),
    captured_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Extend public.earnings_ledger for preliminary collector earnings
ALTER TABLE public.earnings_ledger
ADD COLUMN IF NOT EXISTS collector_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.collector_assignments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS earning_type VARCHAR(30) DEFAULT 'COLLECTION_FEE',
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_collector ON public.collector_assignments(collector_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.collector_assignments(status);
CREATE INDEX IF NOT EXISTS idx_verifications_assignment ON public.collection_verifications(assignment_id);
CREATE INDEX IF NOT EXISTS idx_photos_assignment ON public.collection_photos(assignment_id);
CREATE INDEX IF NOT EXISTS idx_locations_collector ON public.collector_locations(collector_id);

-- 11. Row Level Security
ALTER TABLE public.collection_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_locations ENABLE ROW LEVEL SECURITY;

-- Verification policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Collectors and aggregators can view verifications') THEN
        CREATE POLICY "Collectors and aggregators can view verifications" ON public.collection_verifications
        FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Collectors can insert own verifications') THEN
        CREATE POLICY "Collectors can insert own verifications" ON public.collection_verifications
        FOR INSERT WITH CHECK (auth.uid() = collector_id OR auth.uid() IS NULL);
    END IF;
END $$;

-- Photos policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view relevant collection photos') THEN
        CREATE POLICY "Users can view relevant collection photos" ON public.collection_photos
        FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Collectors can insert collection photos') THEN
        CREATE POLICY "Collectors can insert collection photos" ON public.collection_photos
        FOR INSERT WITH CHECK (auth.uid() = collector_id OR auth.uid() IS NULL);
    END IF;
END $$;

-- Locations policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Collectors can record event locations') THEN
        CREATE POLICY "Collectors can record event locations" ON public.collector_locations
        FOR INSERT WITH CHECK (auth.uid() = collector_id OR auth.uid() IS NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view event locations') THEN
        CREATE POLICY "Authenticated users can view event locations" ON public.collector_locations
        FOR SELECT USING (true);
    END IF;
END $$;
