const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: collectors, error: cErr } = await supabase.from('collectors').select('*');
  console.log('Collectors count:', collectors ? collectors.length : 0);
  if (collectors) console.log(JSON.stringify(collectors, null, 2));

  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, role');
  console.log('Profiles count:', profiles ? profiles.length : 0);
  if (profiles) console.log(JSON.stringify(profiles, null, 2));
}

check();
