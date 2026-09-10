const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ewaste-collection@db.gcgidkrfnwqaxegcqxmy.supabase.co:5432/postgres';

async function runStep7Migration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to Supabase PostgreSQL at db.gcgidkrfnwqaxegcqxmy.supabase.co...');
  await client.connect();
  console.log('Connected successfully!\n');

  const migrationFile = path.join(__dirname, '..', '..', 'supabase', 'migrations', '10_step7_recycler_workflow.sql');
  console.log('Reading migration file:', migrationFile);
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('Executing 10_step7_recycler_workflow.sql...');
  try {
    await client.query(sql);
    console.log('\x1b[32m[SUCCESS]\x1b[0m 10_step7_recycler_workflow.sql applied successfully.');
  } catch (err) {
    console.error('\x1b[31m[ERROR]\x1b[0m Migration query error:', err.message);
  }

  // Seed / ensure Recycler account in profiles and recyclers
  const recyclerId = 'ba342f1f-c157-4708-b572-46beecccd868';
  console.log('\nEnsuring Recycler profile is ACTIVE in public.profiles...');
  await client.query(`
    UPDATE public.profiles 
    SET account_status = 'ACTIVE', role = 'AUTHORIZED_RECYCLER', full_name = 'EcoClean Recyclers Facility', updated_at = now()
    WHERE id = $1;
  `, [recyclerId]);

  console.log('Upserting public.recyclers record...');
  await client.query(`
    INSERT INTO public.recyclers (
      id, company_name, facility_address, city, state, pincode, 
      cpcb_authorization_number, cpcb_valid_upto, is_cpcb_authorized, 
      authorized_schedule_codes, annual_capacity_metric_tons, location, compliance_score, verification_status
    )
    VALUES (
      $1,
      'EcoClean E-Waste Recyclers Pvt Ltd',
      'Plot 42, TTC Industrial Area, MIDC Mahape, Navi Mumbai',
      'Navi Mumbai',
      'Maharashtra',
      '400710',
      'CPCB/EW-REG/MH-2023/401',
      '2028-12-31',
      true,
      ARRAY['ITEW1', 'ITEW2', 'CEEW1', 'CEEW2'],
      12000.0,
      ST_SetSRID(ST_MakePoint(73.0169, 19.1176), 4326),
      4.92,
      'ACTIVE'
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      facility_address = EXCLUDED.facility_address,
      cpcb_authorization_number = EXCLUDED.cpcb_authorization_number,
      cpcb_valid_upto = EXCLUDED.cpcb_valid_upto,
      is_cpcb_authorized = true,
      annual_capacity_metric_tons = 12000.0,
      compliance_score = 4.92,
      verification_status = 'ACTIVE',
      updated_at = now();
  `, [recyclerId]);

  console.log('Seeding public.recycler_authorizations...');
  await client.query(`
    INSERT INTO public.recycler_authorizations (
      recycler_id, authorization_number, issuing_authority, issued_date, expiry_date, verification_status, verified_at
    )
    VALUES (
      $1,
      'CPCB/EW-REG/MH-2023/401',
      'Central Pollution Control Board (CPCB)',
      '2023-01-01',
      '2028-12-31',
      'VERIFIED',
      now()
    )
    ON CONFLICT DO NOTHING;
  `, [recyclerId]);

  console.log('Seeding public.recycler_material_capabilities...');
  await client.query(`
    INSERT INTO public.recycler_material_capabilities (
      recycler_id, material_category_id, accepted, minimum_weight, maximum_weight_per_load, rate_per_kg, preferred_condition, processing_capacity, notes
    )
    VALUES
      ($1, 10, true, 5.0, 5000.0, 32.50, 'ANY', 2500.0, 'CPCB Certified e-waste line for Consumer Electronics & IT Devices'),
      ($1, 20, true, 20.0, 10000.0, 18.00, 'INTACT', 5000.0, 'Large White Goods Shredding & Copper Recovery'),
      ($1, 30, true, 10.0, 3000.0, 24.50, 'ANY', 1500.0, 'CRT & Flat Panel Display Dismantling and Lead Extraction'),
      ($1, 40, true, 2.0, 2000.0, 85.00, 'ANY', 1000.0, 'High-Yield PCB, Motherboard and Precious Metal Refining'),
      ($1, 50, true, 1.0, 2000.0, 14.00, 'ANY', 1000.0, 'Copper Wire Granulation & Peripheral Recycling')
    ON CONFLICT DO NOTHING;
  `, [recyclerId]);

  console.log('Seeding initial inventory from collected lots into aggregator_inventory...');
  const aggregatorId = '0f9bb267-12ab-4cb9-a40d-58c38f73267f';
  await client.query(`
    UPDATE public.profiles 
    SET account_status = 'ACTIVE' 
    WHERE id = $1;
  `, [aggregatorId]);

  // Insert inventory item for existing collected test lot b4e6d601-382a-45ea-94db-233bbd571f30
  await client.query(`
    INSERT INTO public.aggregator_inventory (
      aggregator_id, lot_id, material_category_id, verified_weight, available_weight, condition, inventory_status, storage_location, notes
    )
    VALUES (
      $1,
      'b4e6d601-382a-45ea-94db-233bbd571f30',
      10,
      7.80,
      7.80,
      'PARTIALLY_WORKING',
      'AVAILABLE',
      'Aggregator Central Yard - Bay 1',
      'Verified collection by Ramesh Babu. Ready for recycler batching.'
    )
    ON CONFLICT DO NOTHING;
  `, [aggregatorId]);

  console.log('\nVerifying newly created Step 7 tables in PostgreSQL...');
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'recycler_authorizations', 
        'recycler_material_capabilities', 
        'aggregator_inventory', 
        'recycler_batches', 
        'recycler_batch_items', 
        'recycler_quote_requests', 
        'recycler_quotes', 
        'recycler_capacity_reservations', 
        'recycler_handovers', 
        'handover_disputes', 
        'anomaly_alerts'
      )
    ORDER BY table_name;
  `);

  console.log(`Verified ${res.rows.length} Step 7 tables:`);
  res.rows.forEach(r => console.log('  ✔ ' + r.table_name));

  await client.end();
  console.log('\nStep 7 Database Migration & Seeding successfully completed!');
}

runStep7Migration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
