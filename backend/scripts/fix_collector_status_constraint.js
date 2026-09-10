const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const sql = `
    ALTER TABLE public.collector_assignments DROP CONSTRAINT IF EXISTS collector_assignments_status_check;
    ALTER TABLE public.collector_assignments ADD CONSTRAINT collector_assignments_status_check 
      CHECK (status IN ('PENDING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'ON_THE_WAY', 'EN_ROUTE', 'ARRIVED', 'MATERIAL_VERIFIED', 'COLLECTED', 'COMPLETED', 'CANCELLED', 'EXPIRED'));
  `;

  // We can run SQL via postgres connection or rpc if available, or using pg driver
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL });
  await client.connect();
  console.log('Connected to Postgres. Executing constraint update...');
  await client.query(sql);
  console.log('Successfully updated collector_assignments_status_check constraint!');
  await client.end();
}

fix().catch(console.error);
