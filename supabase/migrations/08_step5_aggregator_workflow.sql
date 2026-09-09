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
