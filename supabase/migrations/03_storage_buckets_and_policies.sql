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
