-- ==============================================================================
-- E-WASTE MANAGEMENT PLATFORM - SEED DATA
-- MIGRATION 05: REFERENCE CATEGORIES, MATERIALS, SAFETY & COMMODITIES
-- ==============================================================================

-- 1. MATERIAL CATEGORIES (CPCB E-Waste Schedule I mapping)
INSERT INTO public.material_categories (code, name, display_names, is_hazardous, cpcb_schedule_code, icon_name, description)
VALUES
    ('CRT_DISPLAY', 'Cathode Ray Tube (CRT)', '{"en": "CRT Monitors & TVs", "hi": "सीआरटी मॉनिटर और टीवी", "mr": "सीआरटी मॉनिटर्स आणि टीव्ही"}', true, 'CEEW1', 'Tv', 'Contains leaded glass and hazardous phosphors requiring controlled vacuum suction'),
    ('FLAT_DISPLAY', 'LCD / LED Flat Panel Display', '{"en": "LCD/LED Screens", "hi": "एलसीडी/एलईडी स्क्रीन", "mr": "एलसीडी/एलईडी स्क्रीन"}', true, 'CEEW1', 'Monitor', 'Flat displays containing mercury cold-cathode lamps (CCFL) or indium tin oxide layers'),
    ('PCB_ASSEMBLY', 'Printed Circuit Boards (PCB)', '{"en": "Circuit Boards / Motherboards", "hi": "सर्किट बोर्ड / मदरबोर्ड", "mr": "सर्किट बोर्ड / मदरबोर्ड"}', false, 'ITEW1', 'Cpu', 'High, medium and low grade electronic circuit boards rich in copper, silver, and gold traces'),
    ('LI_BATTERY', 'Lithium-Ion / Lead Acid Battery', '{"en": "Batteries", "hi": "बैटरी", "mr": "बॅटऱ्या"}', true, 'ITEW2', 'BatteryCharging', 'Rechargeable energy cells prone to thermal runaway and chemical acid spills'),
    ('CABLES_WIRES', 'Cables & Wiring Harnesses', '{"en": "Cables & Wiring", "hi": "तार और केबल", "mr": "वायर आणि केबल्स"}', false, 'ITEW1', 'Cable', 'Insulated PVC/Rubber copper and aluminum electrical conduits'),
    ('COOLING_APPLIANCE', 'Refrigerators & Air Conditioners', '{"en": "Cooling Appliances", "hi": "फ्रिज और एयर कंडीशनर", "mr": "रेफ्रिजरेटर आणि एसी"}', true, 'CEEW2', 'Wind', 'Compressor-bearing white goods with ozone-depleting refrigerants (CFC/HFC) and oils'),
    ('MIXED_PLASTICS', 'Electronics Plastic Housing', '{"en": "E-Waste Mixed Plastics", "hi": "मिश्रित प्लास्टिक आवरण", "mr": "मिश्रित प्लास्टिक"}', false, 'CEEW1', 'Layers', 'Flame-retarded ABS/HIPS/Polycarbonate engineering plastics')
ON CONFLICT (code) DO NOTHING;

-- 2. MATERIALS
INSERT INTO public.materials (category_id, code, name, display_names, hazardous, unit, base_price_per_kg, average_unit_weight_kg, description)
VALUES
    (1, 'CRT_TV_21INCH', '21 Inch CRT Color Television', '{"en": "21\" CRT TV", "hi": "21 इंच सीआरटी टीवी", "mr": "21 इंच सीआरटी टीव्ही"}', true, 'unit', 350.00, 18.5, 'Complete boxed CRT television assembly'),
    (2, 'LCD_LAPTOP_SCREEN', 'Broken Laptop LCD Panel', '{"en": "Laptop Screen", "hi": "लैपटॉप स्क्रीन", "mr": "लॅपटॉप स्क्रीन"}', false, 'unit', 180.00, 0.8, 'TFT LCD panel from notebook computer'),
    (3, 'HIGH_GRADE_MOTHERBOARD', 'High-Grade Desktop Motherboard', '{"en": "Computer Motherboard", "hi": "कंप्यूटर मदरबोर्ड", "mr": "संगणक मदरबोर्ड"}', false, 'kg', 420.00, 0.75, 'Gold pinned ATX motherboard socket'),
    (4, 'SMARTPHONE_LIBATTERY', 'Smartphone Li-Po Battery Cell', '{"en": "Phone Battery", "hi": "फोन बैटरी", "mr": "फोन बॅटरी"}', true, 'unit', 45.00, 0.05, 'Lithium polymer 3.7V - 4.2V pouch cell'),
    (5, 'COPPER_HEAVY_CABLE', 'Stripped Copper Electrical Lead', '{"en": "Copper Wire Scrap", "hi": "तांबे का तार", "mr": "तांब्याची वायर"}', false, 'kg', 580.00, 1.0, 'Clean insulated copper conductors'),
    (6, 'ROTARY_COMPRESSOR', 'Hermetic Refrigerator Compressor', '{"en": "Fridge Compressor", "hi": "फ्रिज कंप्रेसर", "mr": "फ्रिज कॉम्प्रेसर"}', true, 'unit', 650.00, 8.5, 'Sealed compressor pump with copper coil windings'),
    (7, 'ABS_PC_CHASSIS', 'Whitegoods ABS/PC Shell Scrap', '{"en": "Appliance Plastic Shell", "hi": "उपकरण प्लास्टिक केसिंग", "mr": "उपकरण प्लास्टिक"}', false, 'kg', 28.00, 2.5, 'Clean shredded printer/monitor casing plastics')
ON CONFLICT (code) DO NOTHING;

-- 3. SAFETY GUIDANCE
INSERT INTO public.safety_guidance (category_id, hazard_level, title, do_instructions, dont_instructions, audio_url, icon_asset_key)
VALUES
    (1, 'SEVERE_CRITICAL', 
     '{"en": "CRT Vacuum & Leaded Glass Safety", "hi": "सीआरटी वैक्यूम और लेडेड ग्लास सुरक्षा", "mr": "सीआरटी व्हॅक्यूम आणि लेडेड ग्लास सुरक्षा"}',
     '{"en": ["Wear heavy leather gloves and shatterproof goggles", "Keep screen face down on cushioned surface", "Keep intact without crushing neck funnel"], "hi": ["मोटे चमड़े के दस्ताने और सुरक्षा चश्मा पहनें", "स्क्रीन को गद्देदार सतह पर नीचे की ओर रखें", "फनल को बिना तोड़े सुरक्षित रखें"]}',
     '{"en": ["DO NOT strike the glass neck with hammers", "DO NOT dismantle in open residential areas", "DO NOT expose phosphor dust"], "hi": ["कांच की गर्दन पर हथौड़े से वार न करें", "खुले आवासीय क्षेत्रों में न तोड़ें", "फॉस्फर पाउडर को हवा में न उड़ने दें"]}',
     'https://cdn.ewaste.gov.in/safety/crt_safety_hi.mp3',
     'AlertTriangle'
    ),
    (4, 'HIGH',
     '{"en": "Lithium Battery Fire & Acid Prevention", "hi": "लिथियम बैटरी आग और एसिड रोकथाम", "mr": "लिथियम बॅटरी आग आणि ऍसिड प्रतिबंध"}',
     '{"en": ["Tape over exposed copper contacts with insulation tape", "Store in non-conductive dry sand buckets", "Keep fire extinguisher rated for Class D/Chemicals nearby"], "hi": ["खुले संपर्कों को इंसुलेशन टेप से ढक दें", "सूखी रेत की बाल्टी में रखें", "पास में सूखा अग्निशामक रखें"]}',
     '{"en": ["DO NOT puncture swollen battery packs", "DO NOT submerge in water", "DO NOT burn in open scrap heaps"], "hi": ["सूजी हुई बैटरी को न छेदें", "पानी में न डुबोएं", "कचरे के ढेर में आग न लगाएं"]}',
     'https://cdn.ewaste.gov.in/safety/battery_safety_hi.mp3',
     'Flame'
    )
ON CONFLICT DO NOTHING;
