-- Collector workflow hardening: the NestJS service role performs privileged writes;
-- direct Data API access is restricted to the authenticated collector's own records.

DROP POLICY IF EXISTS "Collectors and aggregators can view verifications" ON public.collection_verifications;
DROP POLICY IF EXISTS "Collectors can insert own verifications" ON public.collection_verifications;
DROP POLICY IF EXISTS "Users can view relevant collection photos" ON public.collection_photos;
DROP POLICY IF EXISTS "Collectors can insert collection photos" ON public.collection_photos;
DROP POLICY IF EXISTS "Collectors can record event locations" ON public.collector_locations;
DROP POLICY IF EXISTS "Authenticated users can view event locations" ON public.collector_locations;

CREATE POLICY "Collectors read own verifications"
ON public.collection_verifications FOR SELECT TO authenticated
USING ((select auth.uid()) = collector_id);

CREATE POLICY "Collectors insert own verifications"
ON public.collection_verifications FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = collector_id);

CREATE POLICY "Collectors read own collection photos"
ON public.collection_photos FOR SELECT TO authenticated
USING ((select auth.uid()) = collector_id);

CREATE POLICY "Collectors insert own collection photos"
ON public.collection_photos FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = collector_id);

CREATE POLICY "Collectors read own event locations"
ON public.collector_locations FOR SELECT TO authenticated
USING ((select auth.uid()) = collector_id);

CREATE POLICY "Collectors insert own event locations"
ON public.collector_locations FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = collector_id);

-- High-selectivity ownership and lifecycle indexes for the collector dashboard.
CREATE INDEX IF NOT EXISTS idx_collector_assignments_owner_status_assigned
ON public.collector_assignments (collector_id, status, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_ledger_collector_created
ON public.earnings_ledger (collector_id, created_at DESC);
