const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ewaste-collection@db.gcgidkrfnwqaxegcqxmy.supabase.co:5432/postgres';

async function runStep9Migration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to Supabase PostgreSQL at db.gcgidkrfnwqaxegcqxmy.supabase.co...');
  await client.connect();
  console.log('Connected successfully!\n');

  const migrationFile = path.join(__dirname, '..', '..', 'supabase', 'migrations', '13_step9_admin_command_center.sql');
  console.log('Reading migration file:', migrationFile);
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('Executing 13_step9_admin_command_center.sql...');
  try {
    await client.query(sql);
    console.log('\x1b[32m[SUCCESS]\x1b[0m 13_step9_admin_command_center.sql applied successfully.');
  } catch (err) {
    console.error('\x1b[31m[ERROR]\x1b[0m Migration query error:', err.message);
  }

  // Quick verification of admin alerts and sla rules
  const slas = await client.query('SELECT count(*) FROM public.sla_configurations;');
  const alerts = await client.query('SELECT count(*) FROM public.admin_alerts;');
  console.log(`Verified ${slas.rows[0].count} SLA configurations and ${alerts.rows[0].count} Admin Alerts in database.`);

  await client.end();
}

runStep9Migration().catch(console.error);
