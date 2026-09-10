-- Step 8: immutable payment, earnings, settlement and reconciliation workflow.

DO $$ BEGIN
  BEGIN ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'PAYMENT_DISPUTED'; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

CREATE SEQUENCE IF NOT EXISTS public.payment_obligation_reference_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.payment_transaction_reference_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.settlement_reference_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.financial_adjustment_reference_seq START 1;

CREATE TABLE IF NOT EXISTS public.financial_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handover_id UUID NOT NULL UNIQUE REFERENCES public.recycler_handovers(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.material_lots(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES public.recycler_batches(id) ON DELETE RESTRICT,
  aggregator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  recycler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  accepted_weight_kg NUMERIC(12,3) NOT NULL CHECK (accepted_weight_kg > 0),
  ai_estimated_value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (ai_estimated_value >= 0),
  market_reference_value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (market_reference_value >= 0),
  aggregator_recommended_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (aggregator_recommended_price >= 0),
  aggregator_final_quote NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (aggregator_final_quote >= 0),
  collector_expected_earning NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (collector_expected_earning >= 0),
  collector_final_earning NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (collector_final_earning >= 0),
  recycler_quote NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (recycler_quote >= 0),
  expected_recycler_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (expected_recycler_amount >= 0),
  final_verified_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (final_verified_amount >= 0),
  final_accepted_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (final_accepted_amount >= 0),
  collection_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (collection_cost >= 0),
  handling_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (handling_cost >= 0),
  transport_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (transport_cost >= 0),
  aggregator_margin NUMERIC(14,2) NOT NULL DEFAULT 0,
  adjustment_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_payable NUMERIC(14,2) NOT NULL CHECK (total_payable >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_reference VARCHAR(32) NOT NULL UNIQUE DEFAULT ('PO-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.payment_obligation_reference_seq')::text, 6, '0')),
  calculation_id UUID NOT NULL REFERENCES public.financial_calculations(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.material_lots(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES public.recycler_batches(id) ON DELETE RESTRICT,
  handover_id UUID NOT NULL REFERENCES public.recycler_handovers(id) ON DELETE RESTRICT,
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  payer_role VARCHAR(32) NOT NULL CHECK (payer_role IN ('USER','COLLECTION_COLLECTOR','INFORMAL_AGGREGATOR','AUTHORIZED_RECYCLER')),
  payee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  payee_role VARCHAR(32) NOT NULL CHECK (payee_role IN ('USER','COLLECTION_COLLECTOR','INFORMAL_AGGREGATOR','AUTHORIZED_RECYCLER')),
  obligation_type VARCHAR(32) NOT NULL CHECK (obligation_type IN ('USER_PAYOUT','COLLECTOR_EARNING','RECYCLER_RECEIVABLE','AGGREGATOR_SETTLEMENT','REFUND')),
  original_amount NUMERIC(14,2) NOT NULL CHECK (original_amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('NOT_READY','READY','PENDING','PARTIALLY_SETTLED','SETTLED','DISPUTED','CANCELLED')),
  due_at TIMESTAMPTZ,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (handover_id, obligation_type, payee_id)
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference VARCHAR(32) NOT NULL UNIQUE DEFAULT ('TXN-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.payment_transaction_reference_seq')::text, 6, '0')),
  payment_obligation_id UUID NOT NULL REFERENCES public.payment_obligations(id) ON DELETE RESTRICT,
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  payee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  transaction_type VARCHAR(24) NOT NULL DEFAULT 'PAYMENT' CHECK (transaction_type IN ('PAYMENT','REFUND')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
  payment_method VARCHAR(24) NOT NULL CHECK (payment_method IN ('CASH','UPI','BANK_TRANSFER','OTHER_DIGITAL')),
  provider_name VARCHAR(100), provider_transaction_reference VARCHAR(160),
  cash_reference VARCHAR(160), proof_storage_path TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PENDING_CONFIRMATION','PROCESSING','SUCCESS','FAILED','CANCELLED','REFUNDED','DISPUTED')),
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  failure_reason TEXT, confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ, refunded_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (provider_name, provider_transaction_reference)
);

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_reference VARCHAR(32) NOT NULL UNIQUE DEFAULT ('SET-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.settlement_reference_seq')::text, 6, '0')),
  payment_obligation_id UUID NOT NULL UNIQUE REFERENCES public.payment_obligations(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.material_lots(id) ON DELETE RESTRICT, batch_id UUID REFERENCES public.recycler_batches(id) ON DELETE RESTRICT,
  handover_id UUID NOT NULL REFERENCES public.recycler_handovers(id) ON DELETE RESTRICT,
  party_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  party_role VARCHAR(32) NOT NULL CHECK (party_role IN ('USER','COLLECTION_COLLECTOR','INFORMAL_AGGREGATOR','AUTHORIZED_RECYCLER')),
  settlement_type VARCHAR(32) NOT NULL CHECK (settlement_type IN ('USER_SETTLEMENT','COLLECTOR_SETTLEMENT','AGGREGATOR_SETTLEMENT','RECYCLER_SETTLEMENT')),
  gross_amount NUMERIC(14,2) NOT NULL CHECK (gross_amount >= 0), deductions NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  adjustments NUMERIC(14,2) NOT NULL DEFAULT 0, net_amount NUMERIC(14,2) NOT NULL CHECK (net_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
  status VARCHAR(24) NOT NULL DEFAULT 'READY' CHECK (status IN ('NOT_READY','READY','PENDING','PARTIALLY_SETTLED','SETTLED','DISPUTED')),
  due_at TIMESTAMPTZ, settled_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE RESTRICT,
  obligation_id UUID NOT NULL REFERENCES public.payment_obligations(id) ON DELETE RESTRICT,
  account_owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  account_role VARCHAR(32) NOT NULL CHECK (account_role IN ('USER','COLLECTION_COLLECTOR','INFORMAL_AGGREGATOR','AUTHORIZED_RECYCLER')),
  entry_side VARCHAR(6) NOT NULL CHECK (entry_side IN ('DEBIT','CREDIT')), amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'), description TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, account_owner_id, entry_side)
);

CREATE TABLE IF NOT EXISTS public.financial_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), adjustment_reference VARCHAR(32) NOT NULL UNIQUE DEFAULT ('ADJ-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.financial_adjustment_reference_seq')::text, 6, '0')),
  calculation_id UUID NOT NULL REFERENCES public.financial_calculations(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, requested_role VARCHAR(32) NOT NULL,
  amount NUMERIC(14,2) NOT NULL, reason TEXT NOT NULL, evidence_path TEXT, status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, approved_at TIMESTAMPTZ, rejection_reason TEXT, idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE RESTRICT,
  payment_obligation_id UUID NOT NULL REFERENCES public.payment_obligations(id) ON DELETE RESTRICT,
  raised_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, reason VARCHAR(32) NOT NULL CHECK (reason IN ('WRONG_AMOUNT','PAYMENT_NOT_RECEIVED','DUPLICATE_PAYMENT','CASH_DISPUTE','DIGITAL_PAYMENT_ISSUE','OTHER')),
  description TEXT NOT NULL, disputed_amount NUMERIC(14,2) NOT NULL CHECK (disputed_amount > 0), evidence_path TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED','REJECTED','CANCELLED')),
  resolution TEXT, resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), handover_id UUID NOT NULL UNIQUE REFERENCES public.recycler_handovers(id) ON DELETE RESTRICT,
  calculation_id UUID NOT NULL REFERENCES public.financial_calculations(id) ON DELETE RESTRICT, snapshot JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reconciliation_reference VARCHAR(32) NOT NULL UNIQUE DEFAULT ('REC-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.settlement_reference_seq')::text, 6, '0')),
  handover_id UUID NOT NULL UNIQUE REFERENCES public.recycler_handovers(id) ON DELETE RESTRICT, calculation_id UUID NOT NULL REFERENCES public.financial_calculations(id) ON DELETE RESTRICT,
  expected_weight_kg NUMERIC(12,3) NOT NULL CHECK (expected_weight_kg > 0), accepted_weight_kg NUMERIC(12,3) NOT NULL CHECK (accepted_weight_kg > 0),
  weight_difference_kg NUMERIC(12,3) NOT NULL, status VARCHAR(24) NOT NULL CHECK (status IN ('READY','PENDING','PARTIALLY_SETTLED','SETTLED','DISPUTED')),
  reconciled_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, reconciled_at TIMESTAMPTZ NOT NULL DEFAULT now(), notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_obligations_payer_status ON public.payment_obligations(payer_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_obligations_payee_status ON public.payment_obligations(payee_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_obligation_status ON public.payment_transactions(payment_obligation_id, status);
CREATE INDEX IF NOT EXISTS idx_settlements_party_status ON public.settlements(party_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_owner_created ON public.financial_ledger_entries(account_owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_obligation_status ON public.payment_disputes(payment_obligation_id, status);

CREATE OR REPLACE FUNCTION public.prevent_financial_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Financial ledger entries are immutable'; END; $$;
DROP TRIGGER IF EXISTS financial_ledger_immutable ON public.financial_ledger_entries;
CREATE TRIGGER financial_ledger_immutable BEFORE UPDATE OR DELETE ON public.financial_ledger_entries FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_ledger_mutation();
CREATE OR REPLACE FUNCTION public.prevent_financial_snapshot_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Financial snapshots are immutable'; END; $$;
DROP TRIGGER IF EXISTS financial_snapshot_immutable ON public.financial_snapshots;
CREATE TRIGGER financial_snapshot_immutable BEFORE UPDATE OR DELETE ON public.financial_snapshots FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_snapshot_mutation();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.financial_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reconciliations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.financial_calculations, public.payment_obligations, public.payment_transactions, public.settlements, public.financial_ledger_entries, public.financial_adjustments, public.payment_disputes, public.financial_snapshots, public.financial_reconciliations TO authenticated;

CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.finance_can_view(actor UUID, party UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT actor = party OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = actor AND p.role = 'GOVERNMENT_ADMIN');
$$;
REVOKE ALL ON FUNCTION private.finance_can_view(UUID, UUID) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.finance_can_view(UUID, UUID) TO authenticated;

CREATE POLICY "Finance parties read obligations" ON public.payment_obligations FOR SELECT TO authenticated USING (private.finance_can_view((select auth.uid()), payer_id) OR private.finance_can_view((select auth.uid()), payee_id));
CREATE POLICY "Finance parties read transactions" ON public.payment_transactions FOR SELECT TO authenticated USING (private.finance_can_view((select auth.uid()), payer_id) OR private.finance_can_view((select auth.uid()), payee_id));
CREATE POLICY "Finance parties read settlements" ON public.settlements FOR SELECT TO authenticated USING (private.finance_can_view((select auth.uid()), party_id));
CREATE POLICY "Finance parties read ledger" ON public.financial_ledger_entries FOR SELECT TO authenticated USING (private.finance_can_view((select auth.uid()), account_owner_id));
CREATE POLICY "Finance parties read disputes" ON public.payment_disputes FOR SELECT TO authenticated USING (raised_by = (select auth.uid()) OR EXISTS (SELECT 1 FROM public.payment_obligations po WHERE po.id = payment_obligation_id AND (po.payer_id = (select auth.uid()) OR po.payee_id = (select auth.uid()))) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'GOVERNMENT_ADMIN'));
CREATE POLICY "Finance admins read calculations" ON public.financial_calculations FOR SELECT TO authenticated USING (aggregator_id = (select auth.uid()) OR recycler_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'GOVERNMENT_ADMIN'));
CREATE POLICY "Finance admins read adjustments" ON public.financial_adjustments FOR SELECT TO authenticated USING (requested_by = (select auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'GOVERNMENT_ADMIN'));
CREATE POLICY "Finance parties read snapshots" ON public.financial_snapshots FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.financial_calculations fc WHERE fc.id = calculation_id AND (fc.aggregator_id = (select auth.uid()) OR fc.recycler_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'GOVERNMENT_ADMIN'))));
CREATE POLICY "Finance parties read reconciliations" ON public.financial_reconciliations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.financial_calculations fc WHERE fc.id = calculation_id AND (fc.aggregator_id = (select auth.uid()) OR fc.recycler_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'GOVERNMENT_ADMIN'))));

CREATE POLICY "Finance parties upload payment proof" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs' AND owner_id = (select auth.uid()));
CREATE POLICY "Finance parties read payment proof" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND owner_id = (select auth.uid()));
