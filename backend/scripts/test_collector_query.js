const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: lots, error } = await supabase
    .from('material_lots')
    .select('id, lot_code, status, pickup_address');

  console.log('Lots in DB count:', lots ? lots.length : 0);
  if (lots) console.log(JSON.stringify(lots, null, 2));
}

test();
