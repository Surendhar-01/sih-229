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
