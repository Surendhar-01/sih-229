-- ==============================================================================
-- STEP 4: USER E-WASTE LOT CREATION & CLASSIFICATION SCHEMA
-- Migration: 07_step4_user_lot_creation_schema.sql
-- ==============================================================================

-- 1. Ensure lot_status_enum exists and contains initial citizen workflow statuses
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lot_status_enum') THEN
        CREATE TYPE lot_status_enum AS ENUM (
          'DRAFT', 'CREATED', 'AI_ANALYZED', 'WAITING_FOR_QUOTE', 
          'AGGREGATOR_REVIEW', 'QUOTE_READY', 'COLLECTOR_ASSIGNED', 
          'ON_THE_WAY', 'PICKED_UP', 'MATERIAL_VERIFIED', 
          'AT_AGGREGATOR', 'IN_TRANSIT_TO_RECYCLER', 'AT_RECYCLER', 
          'RECYCLED', 'SETTLED', 'CANCELLED'
        );
    ELSE
        BEGIN ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'DRAFT'; EXCEPTION WHEN duplicate_object THEN null; END;
        BEGIN ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'AI_ANALYZED'; EXCEPTION WHEN duplicate_object THEN null; END;
        BEGIN ALTER TYPE lot_status_enum ADD VALUE IF NOT EXISTS 'WAITING_FOR_QUOTE'; EXCEPTION WHEN duplicate_object THEN null; END;
    END IF;
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
     '{"en": "Consumer Electronics & Computing", "hi": "उपभोक्ता इलेक्ट्रॉनिक्स और कंप्यूटिंग", "mr": "ग्राहक इलेक्ट्रॉनिक्स आणि संगणक"}', 
     false, 'Laptop', 'Laptops, desktops, smartphones, tablets, and personal computing devices'),
    (20, 'LARGE_APPLIANCES', 'Large White Goods & Appliances', 
     '{"en": "Large White Goods & Appliances", "hi": "बड़े घरेलू उपकरण (फ्रिज, एसी, वाशिंग मशीन)", "mr": "मोठी घरगुती उपकरणे (फ्रिज, वॉशिंग मशीन)"}', 
     true, 'Refrigerator', 'Refrigerators, washing machines, air conditioners containing refrigerants and compressors'),
    (30, 'DISPLAYS_SCREENS', 'Displays, Monitors & Televisions', 
     '{"en": "Displays, Monitors & Televisions", "hi": "टेलीविजन, मॉनिटर और डिस्प्ले स्क्रीन", "mr": "टीव्ही, मॉनिटर आणि डिस्प्ले स्क्रीन"}', 
     true, 'Tv', 'CRT TVs, flat panel LED/LCD monitors, laptops screens with mercury/phosphor content'),
    (40, 'ELECTRONIC_COMPONENTS', 'Batteries, PCBs & Circuit Boards', 
     '{"en": "Batteries, PCBs & Circuit Boards", "hi": "बैटरी, सर्किट बोर्ड और पुर्जे", "mr": "बॅटरी, सर्किट बोर्ड आणि सुटे भाग"}', 
     true, 'Cpu', 'Lithium-ion batteries, lead-acid batteries, power supply units, high-grade motherboards'),
    (50, 'PERIPHERALS_CABLES', 'Cables, Chargers & Small Accessories', 
     '{"en": "Cables, Chargers & Small Accessories", "hi": "केबल, चार्जर और सहायक उपकरण", "mr": "केबल्स, चार्जर आणि अ‍ॅक्सेसरीज"}', 
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
     '{"en": "Mobile Phone / Smartphone", "hi": "स्मार्टफोन / मोबाइल", "mr": "मोबाईल फोन / स्मार्टफोन"}', 
     false, 'unit', 350.00, 0.18),
    (102, 10, 'LAPTOP_COMPUTER', 'Laptop Computer (Standard / Ultra)', 
     '{"en": "Laptop Computer", "hi": "लैपटॉप कंप्यूटर", "mr": "लॅपटॉप संगणक"}', 
     false, 'unit', 1400.00, 2.20),
    (103, 10, 'DESKTOP_CPU_TOWER', 'Desktop Computer CPU Tower', 
     '{"en": "Desktop Computer Tower", "hi": "डेस्कटॉप कंप्यूटर टॉवर", "mr": "डेस्कटॉप कॉम्प्युटर टॉवर"}', 
     false, 'unit', 950.00, 7.50),
    (104, 10, 'TABLET_IPAD', 'Tablet / iPad Device', 
     '{"en": "Tablet / iPad", "hi": "टैबलेट / आईपैड", "mr": "टॅबलेट / आयपॅड"}', 
     false, 'unit', 600.00, 0.45),
    (105, 10, 'PRINTER_SCANNER', 'Home/Office Printer or Scanner', 
     '{"en": "Printer / Scanner", "hi": "प्रिंटर / स्कैनर", "mr": "प्रिंटर / स्कॅनर"}', 
     false, 'unit', 400.00, 5.00),

    -- Large Appliances (Cat 20)
    (201, 20, 'REFRIGERATOR_SINGLE_DOOR', 'Single/Double Door Refrigerator', 
     '{"en": "Refrigerator", "hi": "रेफ्रिजरेटर / फ्रिज", "mr": "फ्रिज / रेफ्रिजरेटर"}', 
     true, 'unit', 1800.00, 38.00),
    (202, 20, 'WASHING_MACHINE', 'Washing Machine (Semi/Fully Automatic)', 
     '{"en": "Washing Machine", "hi": "वाशिंग मशीन", "mr": "वॉशिंग मशीन"}', 
     false, 'unit', 1200.00, 28.00),
    (203, 20, 'AIR_CONDITIONER_SPLIT', 'Air Conditioner (Indoor/Outdoor Unit)', 
     '{"en": "Air Conditioner (Split/Window)", "hi": "एयर कंडीशनर (एसी)", "mr": "एअर कंडिशनर (एसी)"}', 
     true, 'unit', 2200.00, 32.00),

    -- Displays & Screens (Cat 30)
    (301, 30, 'LED_LCD_TV', 'Flat Panel LED/LCD Television', 
     '{"en": "Flat Screen LED/LCD TV", "hi": "फ्लैट स्क्रीन एलईडी टीवी", "mr": "फ्लॅट स्क्रीन एलईडी टीव्ही"}', 
     false, 'unit', 850.00, 8.50),
    (302, 30, 'CRT_MONITOR_TV', 'CRT Monitor or Bulky Tube Television', 
     '{"en": "CRT Monitor / Tube TV", "hi": "सीआरटी मॉनिटर / पुराना टीवी", "mr": "सीआरटी मॉनिटर / जुना टीव्ही"}', 
     true, 'unit', 300.00, 18.00),

    -- Components & Batteries (Cat 40)
    (401, 40, 'LI_ION_BATTERY_PACK', 'Lithium-Ion Battery Pack', 
     '{"en": "Lithium-Ion Battery", "hi": "लिथियम-आयन बैटरी", "mr": "लिथियम-आयन बॅटरी"}', 
     true, 'kg', 85.00, 1.00),
    (402, 40, 'LEAD_ACID_UPS_BATTERY', 'Lead-Acid UPS Inverter Battery', 
     '{"en": "Inverter / UPS Lead-Acid Battery", "hi": "इन्वर्टर / यूपीएस बैटरी", "mr": "इन्व्हर्टर बॅटरी"}', 
     true, 'kg', 95.00, 14.00),
    (403, 40, 'HIGH_GRADE_PCB', 'Motherboard / High-Grade PCB', 
     '{"en": "High-Grade Motherboard PCB", "hi": "मदरबोर्ड सर्किट बोर्ड", "mr": "मदरबोर्ड सर्किट बोर्ड"}', 
     false, 'kg', 420.00, 0.60),

    -- Peripherals & Cables (Cat 50)
    (501, 50, 'COPPER_CABLES_WIRES', 'Copper Electric Cables & Wires', 
     '{"en": "Copper Wiring & Cables", "hi": "तांबे के तार और केबल", "mr": "तांब्याच्या तारा आणि केबल्स"}', 
     false, 'kg', 320.00, 1.00),
    (502, 50, 'CHARGERS_ADAPTERS', 'Mobile/Laptop Power Chargers', 
     '{"en": "Charger / Power Adapter", "hi": "चार्जर और अडैप्टर", "mr": "चार्जर आणि अ‍ॅडॉप्टर"}', 
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
