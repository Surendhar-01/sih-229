const http = require('http');

let passed = 0;
let failed = 0;

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${name}`);
    passed++;
  } else {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${name} ${details}`);
    failed++;
  }
}

async function runStep4Tests() {
  console.log('\n========================================================================');
  console.log('   STEP 4: USER E-WASTE LOT CREATION & VALUATION VERIFICATION SUITE');
  console.log('========================================================================\n');

  // Test 1: Material Categories with Hierarchical Subcategories & Multilingual Names
  const r1 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/materials/categories',
    method: 'GET',
  });
  assert(r1.status === 200, 'GET /materials/categories returns 200 OK');
  const categories = r1.body.data || r1.body;
  assert(Array.isArray(categories) && categories.length >= 5, 'Material categories loaded hierarchically (5 parent categories)', `found ${categories.length}`);
  const consumerElectronics = categories.find((c) => c.id === 10 || c.code === 'CONSUMER_ELECTRONICS');
  assert(
    consumerElectronics && consumerElectronics.subcategories && consumerElectronics.subcategories.length >= 3,
    'Hierarchical subcategories present under Consumer Electronics (Laptops, Phones, etc.)'
  );
  assert(
    consumerElectronics && consumerElectronics.display_names && consumerElectronics.display_names.hi,
    'Multilingual category display names present (Hindi & Marathi)'
  );

  // Test 2: AI Visual Material Classification Scan (via NestJS Proxy)
  const r2 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/lots/ai-scan',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      image_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
      user_hints: 'old laptop dell latitude core i5',
    }
  );
  assert(r2.status === 200 || r2.status === 201, 'POST /lots/ai-scan returns 200/201 Success');
  const aiScan = r2.body.data || r2.body;
  assert(aiScan.confidence !== undefined && aiScan.confidence >= 0.5, `AI confidence score calculated: ${aiScan.confidence}`);
  assert(aiScan.material_category !== undefined, `AI categorized device as: ${aiScan.material_category}`);
  assert(aiScan.estimated_value_range !== undefined, 'AI returned estimated indicative value range');

  // Test 3: AI Dynamic Price Analysis Endpoint
  const r3 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/ai/price-analysis',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      material: 'LAPTOP_COMPUTER',
      condition: 'WORKING',
      weight_kg: 2.2,
      quantity: 1,
    }
  );
  assert(r3.status === 200 || r3.status === 201, 'POST /ai/price-analysis returns benchmark price intelligence');
  const priceData = r3.body.data || r3.body;
  assert(priceData.current_average_price > 0, `Benchmark market price returned: ₹${priceData.current_average_price}`);
  assert(priceData.market_trend !== undefined, `Scrap market trend identified: ${priceData.market_trend}`);

  // Test 4: Security Guard - Unauthorized POST /lots rejected
  const r4 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/lots',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      category_id: 10,
      condition: 'WORKING',
      pickup_address: '123 Main Road',
    }
  );
  assert(r4.status === 401, 'Unauthenticated citizen POST /lots correctly rejected with 401 Unauthorized');

  // Test 5: Authorized Citizen Creates E-Waste Lot
  const lotPayload = {
    category_id: 10,
    category_name: 'Consumer Electronics & Computing',
    material_id: 102,
    material_name: 'Laptop Computer',
    description: 'Lenovo ThinkPad T480, cracked hinge, powers on with original adapter',
    condition: 'PARTIALLY_WORKING',
    quantity: 1,
    estimated_weight_kg: 2.1,
    weight_unit: 'kg',
    pickup_address: 'Flat 604, Sai Heritage, SV Road, Bandra West',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pickup_pincode: '400050',
    latitude: 19.0596,
    longitude: 72.8295,
    ai_category: 'CONSUMER_ELECTRONICS',
    ai_subcategory: 'LAPTOP_COMPUTER',
    ai_confidence: 0.92,
    user_confirmed_category: 'Laptop Computer',
    estimated_min_value: 1400.0,
    estimated_max_value: 1900.0,
    estimated_value: 1650.0,
    valuation_currency: 'INR',
    images: [
      {
        image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500',
        original_filename: 'lenovo_t480.jpg',
        file_size: 245000,
        mime_type: 'image/jpeg',
        is_primary: true,
      },
    ],
  };

  const r5 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/lots',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-mock-user',
      },
    },
    lotPayload
  );
  assert(r5.status === 200 || r5.status === 201, 'POST /lots creates verified e-waste collection lot');
  const createdLot = r5.body.data || r5.body;
  assert(
    /^EW-2026-\d{6}$/.test(createdLot.lot_code),
    `Lot code format follows standard EW-2026-XXXXXX: ${createdLot.lot_code}`
  );
  assert(createdLot.status === 'WAITING_FOR_QUOTE', `Initial status is WAITING_FOR_QUOTE: ${createdLot.status}`);
  assert(createdLot.pickup_otp && /^\d{4}$/.test(createdLot.pickup_otp), `Secure 4-digit pickup OTP generated: ${createdLot.pickup_otp}`);
  assert(createdLot.images && createdLot.images.length > 0, 'Lot images saved successfully');
  assert(createdLot.timeline && createdLot.timeline.length > 0, 'Initial lot traceability timeline created');

  // Test 6: GET /lots/my returns citizen lots including newly created lot
  const r6 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/lots/my',
    method: 'GET',
    headers: { Authorization: 'Bearer dev-mock-user' },
  });
  assert(r6.status === 200, 'GET /lots/my returns 200 OK');
  const myLots = r6.body.data || r6.body;
  assert(Array.isArray(myLots) && myLots.length > 0, `Citizen lots retrieved: ${myLots.length} lot(s)`);
  const foundLot = myLots.find((l) => l.lot_code === createdLot.lot_code);
  assert(!!foundLot, `Created lot ${createdLot.lot_code} present in citizen's active lots`);

  // Test 7: GET /lots/:id returns full lot details
  const r7 = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/v1/lots/${createdLot.id}`,
    method: 'GET',
    headers: { Authorization: 'Bearer dev-mock-user' },
  });
  assert(r7.status === 200, `GET /lots/${createdLot.id} returns lot details`);
  const lotDetail = r7.body.data || r7.body;
  assert(lotDetail.lot_code === createdLot.lot_code, 'Lot code matches');
  assert(lotDetail.condition === 'PARTIALLY_WORKING', `Condition grade matches: ${lotDetail.condition}`);
  assert(lotDetail.estimated_min_value === 1400.0, 'Valuation matches');

  // Test 8: Citizen cancels lot prior to pickup
  const r8 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/v1/lots/${createdLot.id}/cancel`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-mock-user',
      },
    },
    { reason: 'Found alternative recycling drive' }
  );
  assert(r8.status === 200 || r8.status === 201, `POST /lots/${createdLot.id}/cancel succeeds`);
  const cancelledLot = r8.body.data || r8.body;
  assert(cancelledLot.status === 'CANCELLED', `Lot status transitioned to CANCELLED: ${cancelledLot.status}`);
  const cancelTimelineEvt = (cancelledLot.timeline || []).find((t) => t.status === 'CANCELLED');
  assert(!!cancelTimelineEvt, 'Cancellation logged in lot audit timeline');

  // Test 9: Re-cancelling a cancelled lot should fail with 400 Bad Request
  const r9 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/v1/lots/${createdLot.id}/cancel`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-mock-user',
      },
    },
    { reason: 'Trying to cancel again' }
  );
  assert(r9.status === 400, 'Cannot cancel already CANCELLED lot (Finite State Machine constraint)');

  // Test 10: Python FastAPI Microservice Direct Health Check
  const r10 = await request({
    host: '127.0.0.1',
    port: 8000,
    path: '/health',
    method: 'GET',
  });
  assert(r10.status === 200, `FastAPI AI microservice healthy on 127.0.0.1:8000 (${r10.body.service || 'FastAPI'})`);

  console.log('\n========================================================================');
  console.log(`STEP 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep4Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
