const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectAuth() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing auth users:', error);
    return;
  }
  console.log(`Found ${data.users.length} auth users:`);
  for (const u of data.users) {
    console.log(`- ${u.id}: ${u.email} (phone: ${u.phone})`);
  }
}

inspectAuth();
