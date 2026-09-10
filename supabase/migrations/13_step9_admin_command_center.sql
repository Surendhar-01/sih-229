-- ==============================================================================
-- STEP 9: GOVERNMENT ADMIN COMMAND CENTER MIGRATION
-- Adds SLA configurations, Admin alerts, and enhances Anomaly/Grievance tracking.
-- ==============================================================================

-- 1. SLA CONFIGURATIONS TABLE (Section 15: Configurable SLA Rules)
CREATE TABLE IF NOT EXISTS public.sla_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    stage VARCHAR(60) NOT NULL,
    threshold_hours NUMERIC(6, 2) NOT NULL CHECK (threshold_hours > 0),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default SLA rules
INSERT INTO public.sla_configurations (rule_name, stage, threshold_hours, description, severity)
VALUES
    ('SLA_LOT_AGGREGATOR_REVIEW', 'WAITING_FOR_QUOTE', 24.0, 'Maximum time a citizen lot can wait for aggregator review/claim', 'MEDIUM'),
    ('SLA_COLLECTOR_ASSIGNMENT', 'COLLECTOR_DISPATCH', 12.0, 'Maximum time an assignment can wait for collector acceptance', 'HIGH'),
    ('SLA_COLLECTOR_START_PICKUP', 'COLLECTOR_START', 6.0, 'Maximum hours between collector accepting and starting transit', 'MEDIUM'),
    ('SLA_TRANSIT_DURATION', 'ON_THE_WAY', 4.0, 'Maximum time allowed for on-the-way transit to doorstep scale weighing', 'HIGH'),
    ('SLA_RECYCLER_QUOTE_RESPONSE', 'RECYCLER_MATCHING', 48.0, 'Maximum time allowed for CPCB recycler to respond to batch quote request', 'MEDIUM'),
    ('SLA_CONSIGNMENT_HANDOVER', 'IN_TRANSIT_TO_RECYCLER', 72.0, 'Maximum time for aggregator shipment to arrive at recycler weighbridge', 'HIGH'),
    ('SLA_FINANCIAL_SETTLEMENT', 'PAYMENT_PENDING', 48.0, 'Maximum time for bank/UPI settlement confirmation to be completed', 'CRITICAL')
ON CONFLICT (rule_name) DO UPDATE SET
    threshold_hours = EXCLUDED.threshold_hours,
    description = EXCLUDED.description,
    severity = EXCLUDED.severity,
    updated_at = now();

-- 2. ADMIN ALERTS TABLE (Section 24 & 31: Realtime Alerts & SLA Breaches)
CREATE TABLE IF NOT EXISTS public.admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(60) NOT NULL CHECK (alert_type IN (
        'SLA_BREACH', 
        'LARGE_DISCREPANCY', 
        'PAYMENT_DISPUTE', 
        'RECYCLER_AUTH_EXPIRY', 
        'COMPLAINT_ESCALATION', 
        'CRITICAL_ANOMALY', 
        'HAZARDOUS_MISROUTING',
        'PRICE_OUTLIER'
    )),
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(60),
    entity_id VARCHAR(100),
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- Seed realistic demo alerts for Admin Command Center if table is empty
INSERT INTO public.admin_alerts (alert_type, severity, title, description, entity_type, entity_id, status)
SELECT 
    'PRICE_OUTLIER',
    'HIGH',
    'Abnormal Scrap Valuation: ₹850/kg on PCB Lot',
    'Quoted price exceeds 30-day regional standard by +64.2%. Potential commodity fraud or Li-ion battery misdeclaration.',
    'material_lots',
    'lot-001',
    'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_alerts WHERE alert_type = 'PRICE_OUTLIER');

INSERT INTO public.admin_alerts (alert_type, severity, title, description, entity_type, entity_id, status)
SELECT 
    'LARGE_DISCREPANCY',
    'CRITICAL',
    'Weighbridge Discrepancy > 12% on Handover RH-2026-000012',
    'Received weight at EcoClean Facility (6.8 kg) differed from manifest dispatch weight (7.8 kg) by 12.8%. Form 6 anomaly generated.',
    'recycler_handovers',
    'RH-2026-000012',
    'INVESTIGATING'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_alerts WHERE alert_type = 'LARGE_DISCREPANCY');

INSERT INTO public.admin_alerts (alert_type, severity, title, description, entity_type, entity_id, status)
SELECT 
    'RECYCLER_AUTH_EXPIRY',
    'MEDIUM',
    'CPCB License Renewal Due in 60 Days',
    'Facility CPCB/EW-REG/MH-2023/401 (EcoClean Recyclers) authorization license up for statutory renewal.',
    'recyclers',
    'ba342f1f-c157-4708-b572-46beecccd868',
    'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_alerts WHERE alert_type = 'RECYCLER_AUTH_EXPIRY');

-- 3. ENSURE COMPLAINTS TABLE HAS COMPREHENSIVE STATUS AND FIELDS
DO $$ BEGIN
    ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';
    ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. ENSURE GOVERNMENT ADMIN PROFILE HAS ACTIVE STATUS
UPDATE public.profiles
SET account_status = 'ACTIVE', role = 'GOVERNMENT_ADMIN', full_name = 'Central CPCB Monitoring Officer'
WHERE email = 'admin@ewaste.gov.in';

-- 5. RLS POLICIES FOR GOVERNMENT ADMIN COMMAND CENTER
ALTER TABLE public.sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users with GOVERNMENT_ADMIN role to manage admin tables
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view and manage sla_configurations" ON public.sla_configurations;
    CREATE POLICY "Admins can view and manage sla_configurations"
        ON public.sla_configurations
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() AND profiles.role = 'GOVERNMENT_ADMIN'
            )
        );

    DROP POLICY IF EXISTS "Admins can view and manage admin_alerts" ON public.admin_alerts;
    CREATE POLICY "Admins can view and manage admin_alerts"
        ON public.admin_alerts
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() AND profiles.role = 'GOVERNMENT_ADMIN'
            )
        );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
