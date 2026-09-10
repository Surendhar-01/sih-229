const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ewaste-collection@db.gcgidkrfnwqaxegcqxmy.supabase.co:5432/postgres';

async function runMigrations() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to Supabase PostgreSQL at db.gcgidkrfnwqaxegcqxmy.supabase.co...');
  await client.connect();
  console.log('Connected successfully!\n');

  const migrationsDir = path.join(__dirname, '..', '..', 'supabase', 'migrations');
  const migrationFiles = [
    '01_core_schema.sql',
    '02_auth_and_roles_triggers.sql',
    '03_storage_buckets_and_policies.sql',
    '04_row_level_security.sql',
    '05_seed_data.sql',
    '06_step3_auth_and_approval_schema.sql',
    '07_step4_user_lot_creation_schema.sql',
    '08_step5_aggregator_workflow.sql',
    '09_step6_collector_workflow.sql',
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${file}, skipping.`);
      continue;
    }

    console.log(`Executing migration: ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await client.query(sql);
      console.log(`\x1b[32m[SUCCESS]\x1b[0m ${file} applied successfully.`);
    } catch (err) {
      console.error(`\x1b[31m[ERROR]\x1b[0m Failed executing ${file}:`, err.message);
      // Continue if object already exists or non-fatal
    }
  }

  // Verify created tables
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('\n=============================================================');
  console.log(`Database Setup Complete! Tables created in public schema (${tablesRes.rows.length}):`);
  tablesRes.rows.forEach(r => console.log('  - ' + r.table_name));
  console.log('=============================================================\n');

  await client.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
