-- ==============================================================================
-- STEP 7: COMPLETE AUTHORIZED RECYCLER WORKFLOW SCHEMA
-- Migration: 10_step7_recycler_workflow.sql
-- ==============================================================================

-- 1. Sequences for human-readable codes
CREATE SEQUENCE IF NOT EXISTS recycler_batch_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS recycler_quote_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS recycler_handover_code_seq START 1;

-- 2. Recycler Authorizations Table (Regulatory Compliance)
CREATE TABLE IF NOT EXISTS public.recycler_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recycler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    authorization_number VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(100) NOT NULL DEFAULT 'Central Pollution Control Board (CPCB)',
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    document_storage_path TEXT,
    verification_status VARCHAR(30) DEFAULT 'VERIFIED' CHECK (verification_status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'SUSPENDED')),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ DEFAULT now(),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Recycler Material Capabilities Table
CREATE TABLE IF NOT EXISTS public.recycler_material_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recycler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    material_category_id INT REFERENCES public.material_categories(id) ON DELETE CASCADE,
    material_id INT REFERENCES public.materials(id) ON DELETE CASCADE,
    accepted BOOLEAN DEFAULT true,
    minimum_weight NUMERIC(10, 2) DEFAULT 1.0,
    maximum_weight_per_load NUMERIC(10, 2) DEFAULT 5000.0,
    rate_per_kg NUMERIC(10, 2) NOT NULL DEFAULT 25.0,
    preferred_condition VARCHAR(30) DEFAULT 'ANY',
    processing_capacity NUMERIC(12, 2) DEFAULT 1000.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Aggregator Inventory Table (Material received & stored at aggregator yard)
CREATE TABLE IF NOT EXISTS public.aggregator_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    lot_id UUID REFERENCES public.material_lots(id) ON DELETE RESTRICT,
    collector_assignment_id UUID REFERENCES public.collector_assignments(id) ON DELETE SET NULL,
    material_id INT REFERENCES public.materials(id) ON DELETE SET NULL,
    material_category_id INT REFERENCES public.material_categories(id) ON DELETE SET NULL,
    verified_weight NUMERIC(10, 2) NOT NULL,
    available_weight NUMERIC(10, 2) NOT NULL,
    condition VARCHAR(30) DEFAULT 'INTACT',
    inventory_status VARCHAR(30) DEFAULT 'AVAILABLE' CHECK (inventory_status IN ('PENDING_RECEIPT', 'AVAILABLE', 'RESERVED_FOR_RECYCLER', 'IN_TRANSIT', 'HANDED_OVER', 'CANCELLED')),
    received_at TIMESTAMPTZ DEFAULT now(),
    storage_location VARCHAR(150) DEFAULT 'Aggregator Central Yard - Bay 1',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Recycler Batches (Lot consolidation for B2B wholesale recycling)
CREATE TABLE IF NOT EXISTS public.recycler_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(30) UNIQUE NOT NULL,
    aggregator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    material_category_id INT REFERENCES public.material_categories(id) ON DELETE SET NULL,
    total_weight NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'READY_FOR_MATCHING', 'QUOTE_REQUESTED', 'RECYCLER_SELECTED', 'HANDOVER_PENDING', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Recycler Batch Items (Items linked into a batch)
CREATE TABLE IF NOT EXISTS public.recycler_batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.recycler_batches(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.aggregator_inventory(id) ON DELETE SET NULL,
    lot_id UUID REFERENCES public.material_lots(id) ON DELETE SET NULL,
    weight NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Recycler Quote Requests (Invitations from aggregator to recyclers)
CREATE TABLE IF NOT EXISTS public.recycler_quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.recycler_batches(id) ON DELETE CASCADE,
    aggregator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    recycler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'VIEWED', 'RESPONDED', 'EXPIRED', 'CANCELLED')),
    requested_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '3 days'),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Extend / Update Recycler Quotes Table
ALTER TABLE public.recycler_quotes ALTER COLUMN lot_id DROP NOT NULL;

ALTER TABLE public.recycler_quotes
ADD COLUMN IF NOT EXISTS quote_code VARCHAR(30) UNIQUE,
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.recycler_batches(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS aggregator_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS rate_per_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS base_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS pickup_cost NUMERIC(10, 2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS transport_cost NUMERIC(10, 2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS handling_adjustment NUMERIC(10, 2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS other_adjustment NUMERIC(10, 2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_quote_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS pickup_supported BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS proposed_pickup_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update constraint on status
ALTER TABLE public.recycler_quotes DROP CONSTRAINT IF EXISTS recycler_quotes_status_check;
ALTER TABLE public.recycler_quotes ADD CONSTRAINT recycler_quotes_status_check 
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN'));

-- 9. STRICT CONCURRENCY LOCK: Only ONE quote can be accepted per batch
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_accepted_quote_per_batch 
ON public.recycler_quotes (batch_id) 
WHERE status = 'ACCEPTED';

-- 10. Recycler Capacity Reservations
CREATE TABLE IF NOT EXISTS public.recycler_capacity_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recycler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.recycler_batches(id) ON DELETE CASCADE,
    reserved_weight NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'USED', 'RELEASED', 'EXPIRED')),
    reserved_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Recycler Handovers (Logistics, dispatch, arrival, physical verification)
CREATE TABLE IF NOT EXISTS public.recycler_handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handover_code VARCHAR(30) UNIQUE NOT NULL,
    batch_id UUID NOT NULL REFERENCES public.recycler_batches(id) ON DELETE RESTRICT,
    aggregator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    recycler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    quote_id UUID REFERENCES public.recycler_quotes(id) ON DELETE RESTRICT,
    handover_type VARCHAR(40) DEFAULT 'RECYCLER_PICKUP' CHECK (handover_type IN ('RECYCLER_PICKUP', 'AGGREGATOR_DELIVERY', 'THIRD_PARTY_TRANSPORT')),
    scheduled_date TIMESTAMPTZ,
    actual_dispatch_time TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    expected_weight NUMERIC(10, 2) NOT NULL,
    received_weight NUMERIC(10, 2),
    accepted_weight NUMERIC(10, 2),
    rejected_weight NUMERIC(10, 2) DEFAULT 0.0,
    status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'ARRIVED', 'UNDER_VERIFICATION', 'RECEIVED', 'DISPUTED', 'CANCELLED')),
    transport_reference VARCHAR(100),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    handover_notes TEXT,
    recycler_notes TEXT,
    discrepancy_percentage NUMERIC(5, 2) DEFAULT 0.0,
    quality_decision VARCHAR(30) CHECK (quality_decision IN ('ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED')),
    rejection_reason TEXT,
    proof_documents JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Handover Disputes
CREATE TABLE IF NOT EXISTS public.handover_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handover_id UUID NOT NULL REFERENCES public.recycler_handovers(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.recycler_batches(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('WEIGHT_DIFFERENCE', 'MATERIAL_MISMATCH', 'QUALITY_ISSUE', 'DAMAGED_DURING_TRANSPORT', 'DOCUMENTATION_ISSUE', 'PRICE_DISAGREEMENT', 'OTHER')),
    description TEXT NOT NULL,
    expected_weight NUMERIC(10, 2),
    actual_weight NUMERIC(10, 2),
    disputed_weight NUMERIC(10, 2),
    evidence_paths TEXT[],
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELLED')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- 13. Anomaly Alerts Table (Weight discrepancy > 5%, pricing deviations, compliance violations)
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    metadata JSONB,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Storage Buckets for Recycler Workflow
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('recycler-authorization-documents', 'recycler-authorization-documents', false, 15728640, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('recycler-handover-proof', 'recycler-handover-proof', false, 15728640, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('aggregator-dispatch-proof', 'aggregator-dispatch-proof', false, 15728640, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 15. Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_rec_auth_recycler_id ON public.recycler_authorizations(recycler_id);
CREATE INDEX IF NOT EXISTS idx_rec_cap_recycler_id ON public.recycler_material_capabilities(recycler_id);
CREATE INDEX IF NOT EXISTS idx_rec_cap_cat_id ON public.recycler_material_capabilities(material_category_id);
CREATE INDEX IF NOT EXISTS idx_agg_inv_aggregator_id ON public.aggregator_inventory(aggregator_id);
CREATE INDEX IF NOT EXISTS idx_agg_inv_status ON public.aggregator_inventory(inventory_status);
CREATE INDEX IF NOT EXISTS idx_rec_batches_aggregator_id ON public.recycler_batches(aggregator_id);
CREATE INDEX IF NOT EXISTS idx_rec_batches_status ON public.recycler_batches(status);
CREATE INDEX IF NOT EXISTS idx_rec_batch_items_batch_id ON public.recycler_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_rec_quotes_batch_id ON public.recycler_quotes(batch_id);
CREATE INDEX IF NOT EXISTS idx_rec_quotes_recycler_id ON public.recycler_quotes(recycler_id);
CREATE INDEX IF NOT EXISTS idx_rec_cap_res_recycler_id ON public.recycler_capacity_reservations(recycler_id);
CREATE INDEX IF NOT EXISTS idx_rec_handovers_batch_id ON public.recycler_handovers(batch_id);
CREATE INDEX IF NOT EXISTS idx_rec_handovers_recycler_id ON public.recycler_handovers(recycler_id);
CREATE INDEX IF NOT EXISTS idx_rec_handovers_status ON public.recycler_handovers(status);
CREATE INDEX IF NOT EXISTS idx_disputes_handover_id ON public.handover_disputes(handover_id);

-- 16. Enable Row Level Security
ALTER TABLE public.recycler_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_material_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregator_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_capacity_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;

-- 17. Policies: Allow authenticated users with role check to access respective data
DROP POLICY IF EXISTS "Recycler authorizations viewable by owner and admin" ON public.recycler_authorizations;
CREATE POLICY "Recycler authorizations viewable by owner and admin" ON public.recycler_authorizations
FOR SELECT TO authenticated USING (
    recycler_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('GOVERNMENT_ADMIN', 'INFORMAL_AGGREGATOR'))
);

DROP POLICY IF EXISTS "Recyclers manage own capabilities" ON public.recycler_material_capabilities;
CREATE POLICY "Recyclers manage own capabilities" ON public.recycler_material_capabilities
FOR ALL TO authenticated USING (
    recycler_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('GOVERNMENT_ADMIN', 'INFORMAL_AGGREGATOR'))
);

DROP POLICY IF EXISTS "Aggregators manage own inventory" ON public.aggregator_inventory;
CREATE POLICY "Aggregators manage own inventory" ON public.aggregator_inventory
FOR ALL TO authenticated USING (
    aggregator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('GOVERNMENT_ADMIN', 'AUTHORIZED_RECYCLER'))
);

DROP POLICY IF EXISTS "Aggregators and Recyclers view batches" ON public.recycler_batches;
CREATE POLICY "Aggregators and Recyclers view batches" ON public.recycler_batches
FOR ALL TO authenticated USING (
    aggregator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('GOVERNMENT_ADMIN', 'AUTHORIZED_RECYCLER'))
);

DROP POLICY IF EXISTS "Batch items access" ON public.recycler_batch_items;
CREATE POLICY "Batch items access" ON public.recycler_batch_items
FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.recycler_batches b 
        WHERE b.id = batch_id AND (b.aggregator_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('GOVERNMENT_ADMIN', 'AUTHORIZED_RECYCLER')))
    )
);

DROP POLICY IF EXISTS "Quote requests access" ON public.recycler_quote_requests;
CREATE POLICY "Quote requests access" ON public.recycler_quote_requests
FOR ALL TO authenticated USING (
    aggregator_id = auth.uid() OR recycler_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'GOVERNMENT_ADMIN')
);

DROP POLICY IF EXISTS "Capacity reservations access" ON public.recycler_capacity_reservations;
CREATE POLICY "Capacity reservations access" ON public.recycler_capacity_reservations
FOR ALL TO authenticated USING (
    recycler_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('GOVERNMENT_ADMIN', 'INFORMAL_AGGREGATOR'))
);

DROP POLICY IF EXISTS "Handovers access" ON public.recycler_handovers;
CREATE POLICY "Handovers access" ON public.recycler_handovers
FOR ALL TO authenticated USING (
    recycler_id = auth.uid() OR aggregator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'GOVERNMENT_ADMIN')
);

DROP POLICY IF EXISTS "Handover disputes access" ON public.handover_disputes;
CREATE POLICY "Handover disputes access" ON public.handover_disputes
FOR ALL TO authenticated USING (
    raised_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.recycler_handovers h
        WHERE h.id = handover_id AND (h.recycler_id = auth.uid() OR h.aggregator_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'GOVERNMENT_ADMIN')
);
