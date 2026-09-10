const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Seeding Step 6 Aggregator and Collectors into Supabase...');

  async function getOrCreateUser(email, phone, fullName, role) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list.users.find(u => u.email === email || u.phone === phone);
    if (existing) {
      console.log(`User ${email} already exists with ID: ${existing.id}`);
      return existing.id;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      phone,
      password: 'Password123!',
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { full_name: fullName, role }
    });

    if (error) {
      console.error(`Error creating user ${email}:`, error.message);
      // If error because user exists under another credential, list again
      const { data: list2 } = await supabase.auth.admin.listUsers();
      const found = list2?.users?.find(u => u.email === email);
      if (found) return found.id;
      throw error;
    }

    console.log(`Created user ${email} with ID: ${data.user.id}`);
    return data.user.id;
  }

  // 1. Aggregator
  const aggregatorId = await getOrCreateUser(
    'aggregator@ewaste.gov.in',
    '+919876543211',
    'Ibrahim Khan (Scrap Yard Hub)',
    'INFORMAL_AGGREGATOR'
  );

  // Upsert profile
  await supabase.from('profiles').upsert({
    id: aggregatorId,
    phone: '+919876543211',
    email: 'aggregator@ewaste.gov.in',
    full_name: 'Ibrahim Khan',
    role: 'INFORMAL_AGGREGATOR',
    preferred_language: 'hi',
    is_active: true,
    is_verified: true,
    updated_at: new Date().toISOString()
  });

  // Upsert aggregator yard
  await supabase.from('aggregators').upsert({
    id: aggregatorId,
    business_name: 'Dharavi Central Scrap Godown',
    yard_address: 'Yard 12, 60 Feet Road, Dharavi',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400017',
    storage_capacity_sqft: 2500,
    is_formalized_partner: true,
    rating: 4.85,
    location: 'SRID=4326;POINT(72.8464 19.0434)',
    updated_at: new Date().toISOString()
  });

  // 2. Collector 1
  const collector1Id = await getOrCreateUser(
    'collector@ewaste.gov.in',
    '+919876543212',
    'Ramesh Babu (Auto-Rickshaw)',
    'COLLECTION_COLLECTOR'
  );

  await supabase.from('profiles').upsert({
    id: collector1Id,
    phone: '+919876543212',
    email: 'collector@ewaste.gov.in',
    full_name: 'Ramesh Babu',
    role: 'COLLECTION_COLLECTOR',
    preferred_language: 'mr',
    is_active: true,
    is_verified: true,
    updated_at: new Date().toISOString()
  });

  await supabase.from('collectors').upsert({
    id: collector1Id,
    vehicle_type: 'AUTO_RICKSHAW',
    vehicle_registration_no: 'MH-02-BT-4122',
    is_available: true,
    availability: 'AVAILABLE',
    area: 'Kurla West',
    district: 'Mumbai',
    state: 'Maharashtra',
    service_radius_km: 15,
    reliability_score: 98.50,
    rating: 4.90,
    active_jobs_count: 0,
    completion_rate: 99.00,
    total_pickups_completed: 34,
    total_collected_weight_kg: 480.50,
    total_earnings: 5200.00,
    current_location: 'SRID=4326;POINT(72.8777 19.0760)',
    updated_at: new Date().toISOString()
  });

  // 3. Collector 2
  const collector2Id = await getOrCreateUser(
    'collector2@ewaste.gov.in',
    '+919876543215',
    'Suresh Scrap Runner (Mini-Truck)',
    'COLLECTION_COLLECTOR'
  );

  await supabase.from('profiles').upsert({
    id: collector2Id,
    phone: '+919876543215',
    email: 'collector2@ewaste.gov.in',
    full_name: 'Suresh Scrap Runner',
    role: 'COLLECTION_COLLECTOR',
    preferred_language: 'hi',
    is_active: true,
    is_verified: true,
    updated_at: new Date().toISOString()
  });

  await supabase.from('collectors').upsert({
    id: collector2Id,
    vehicle_type: 'MINI_TRUCK',
    vehicle_registration_no: 'MH-03-AX-8910',
    is_available: true,
    availability: 'AVAILABLE',
    area: 'Dharavi Central',
    district: 'Mumbai',
    state: 'Maharashtra',
    service_radius_km: 25,
    reliability_score: 94.00,
    rating: 4.75,
    active_jobs_count: 0,
    completion_rate: 96.00,
    total_pickups_completed: 58,
    total_collected_weight_kg: 1250.00,
    total_earnings: 11400.00,
    current_location: 'SRID=4326;POINT(72.8550 19.0400)',
    updated_at: new Date().toISOString()
  });

  // 4. Seed Material Lot
  const citizenId = '6749d61f-3dd8-408a-b46c-6815cf077487';
  const lotId = 'b4e6d601-382a-45ea-94db-233bbd571f30';
  await supabase.from('material_lots').upsert({
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

  console.log('--- SEEDING COMPLETE ---');
  console.log({
    aggregatorId,
    collector1Id,
    collector2Id,
    lotId
  });
}

seed().catch(console.error);
