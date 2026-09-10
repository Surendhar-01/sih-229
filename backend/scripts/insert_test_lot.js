const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLot() {
  const citizenId = 'ff18a5bd-eccc-4ca5-9666-27be86895460';
  const lotId = 'b4e6d601-382a-45ea-94db-233bbd571f30';
  const res = await supabase.from('material_lots').upsert({
    id: lotId,
    lot_code: 'EW-2026-000101',
    user_id: citizenId,
    description: 'Bulk Consumer Electronics & Mixed E-Waste Lot',
    condition: 'INTACT',
    estimated_weight_kg: 18.5,
    pickup_address: 'Flat 402, Sea Breeze Apts, Andheri West, Mumbai',
    pickup_pincode: '400058',
    pickup_location: 'SRID=4326;POINT(72.8464 19.1197)',
    status: 'AGGREGATOR_REVIEW',
    updated_at: new Date().toISOString()
  });

  console.log('Upsert lot result:', res.error ? res.error : 'SUCCESS');
}

checkLot();
