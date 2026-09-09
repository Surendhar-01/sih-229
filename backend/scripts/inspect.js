const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function inspect() {
  await client.connect();
  const enums = await client.query(`
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON 1=1 AND n.oid = t.typnamespace
    WHERE t.typtype = 'e' AND n.nspname = 'public';
  `);
  console.log('Public Enums:', enums.rows.map(r => r.typname));

  const lotCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'material_lots';
  `);
  console.log('material_lots columns count:', lotCols.rows.length);

  await client.end();
}

inspect().catch(console.error);
