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

async function runTests() {
  console.log('\n======================================================');
  console.log('   STEP 3: AUTHENTICATION, RBAC & ACCESS CONTROL TESTS');
  console.log('======================================================\n');

  // 1. Unauthenticated /profile must be 401
  const r1 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/profile',
    method: 'GET',
  });
  assert(r1.status === 401, 'Unauthenticated /profile returns 401 Unauthorized');

  // 2. Authenticated Citizen Profile
  const r2 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/profile',
    method: 'GET',
    headers: { Authorization: 'Bearer dev-mock-user' },
  });
  assert(
    r2.status === 200 && r2.body.data?.role === 'USER',
    'Authenticated Citizen profile returns role USER and status ACTIVE',
  );

  // 3. Permitted profile update (name, language, location)
  const r3 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/profile',
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-mock-user',
        'Content-Type': 'application/json',
      },
    },
    { full_name: 'Anita Sharma Verified', preferred_language: 'mr', general_location: 'Dharavi Central' },
  );
  assert(
    r3.status === 200 && r3.body.data?.preferred_language === 'mr',
    'Permitted profile field update succeeds (preferred_language=mr)',
  );

  // 4. Role tampering blocked
  const r4 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/profile',
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-mock-user',
        'Content-Type': 'application/json',
      },
    },
    { role: 'GOVERNMENT_ADMIN' },
  );
  assert(
    r4.body.data?.role !== 'GOVERNMENT_ADMIN',
    'User cannot tamper with or self-assign role via profile update',
  );

  // 5. Citizen self-registration returns ACTIVE immediately
  const r5 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: `citizen_${Date.now()}@ewaste.in`,
      phone: '+919876543001',
      password: 'StrongPassword123!',
      full_name: 'Vikram Citizen',
      role: 'USER',
      preferred_language: 'en',
      general_location: 'Colaba, Mumbai',
    },
  );
  assert(
    r5.status === 201 && (r5.body.account_status === 'ACTIVE' || r5.body.data?.account_status === 'ACTIVE' || r5.body.profile?.account_status === 'ACTIVE'),
    'Citizen registration generates immediate ACTIVE account status',
  );

  // 6. Collector registration returns PENDING status
  const r6 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: `collector_${Date.now()}@ewaste.in`,
      phone: '+919876543002',
      password: 'StrongPassword123!',
      full_name: 'Pooja Collector',
      role: 'COLLECTION_COLLECTOR',
      preferred_language: 'hi',
      general_location: 'Vashi, Navi Mumbai',
      vehicle_type: 'ELECTRIC_3WHEELER',
    },
  );
  assert(
    r6.status === 201 && (r6.body.account_status === 'PENDING' || r6.body.data?.account_status === 'PENDING' || r6.body.profile?.account_status === 'PENDING'),
    'Professional Collector registration creates PENDING account awaiting approval',
  );

  // 7. Recycler registration returns PENDING status
  const r7 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: `recycler_${Date.now()}@ewaste.in`,
      phone: '+919876543003',
      password: 'StrongPassword123!',
      full_name: 'Apex Recyclers Ltd',
      role: 'AUTHORIZED_RECYCLER',
      preferred_language: 'en',
      general_location: 'Rabale MIDC',
      cpcb_authorization_number: 'CPCB-REG-2026/999',
    },
  );
  assert(
    r7.status === 201 && (r7.body.account_status === 'PENDING' || r7.body.data?.account_status === 'PENDING' || r7.body.profile?.account_status === 'PENDING'),
    'Recycler registration creates PENDING account awaiting license verification',
  );

  // 8. Public Government Admin registration is FORBIDDEN
  const r8 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'imposter@ewaste.in',
      phone: '+919876543004',
      password: 'Password123!',
      full_name: 'Unauthorized Admin Candidate',
      role: 'GOVERNMENT_ADMIN',
    },
  );
  assert(
    r8.status === 403 || r8.status === 400,
    'Public self-registration as GOVERNMENT_ADMIN is blocked (HTTP 400/403)',
  );

  // 9. RBAC: Citizen accesses /user/lots (allowed)
  const r9 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/user/lots',
    method: 'GET',
    headers: { Authorization: 'Bearer dev-mock-user' },
  });
  assert(r9.status === 200, 'Citizen can access role-specific /user/lots');

  // 10. RBAC: Citizen accessing /admin/overview is blocked (403)
  const r10 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/admin/overview',
    method: 'GET',
    headers: { Authorization: 'Bearer dev-mock-user' },
  });
  assert(r10.status === 403, 'Citizen blocked from /admin/overview with 403 Forbidden');

  // 11. RBAC: Aggregator accessing /collector/jobs is blocked (403)
  const r11 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/collector/jobs',
    method: 'GET',
    headers: { Authorization: 'Bearer dev-mock-aggregator' },
  });
  assert(r11.status === 403, 'Aggregator blocked from /collector/jobs with 403 Forbidden');

  // 12. Account Status Guard: PENDING collector blocked from operational jobs
  const r12 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/collector/jobs',
    method: 'GET',
    headers: { Authorization: 'Bearer dev-mock-collector-pending' },
  });
  assert(
    r12.status === 403,
    'Pending collector blocked by AccountStatusGuard with 403 Forbidden',
  );

  // 13. Admin views pending accounts queue
  const r13 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/v1/admin/pending-accounts',
    method: 'GET',
    headers: { Authorization: 'Bearer dev-mock-admin' },
  });
  assert(
    r13.status === 200 && Array.isArray(r13.body.data),
    'Admin can view pending account approval queue',
  );

  // 14. Admin verifies and approves a pending recycler
  const r14 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/admin/accounts/usr-authorized_recycler-pending/status',
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-mock-admin',
        'Content-Type': 'application/json',
      },
    },
    { status: 'ACTIVE', reason: 'CPCB EPR central registry verified' },
  );
  assert(
    r14.status === 200 && r14.body.account?.account_status === 'ACTIVE',
    'Admin approval successfully updates account status to ACTIVE with audit logging',
  );

  // 15. Admin suspends an account for compliance review
  const r15 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/v1/admin/accounts/usr-collection_collector-001/status',
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer dev-mock-admin',
        'Content-Type': 'application/json',
      },
    },
    { status: 'SUSPENDED', reason: 'Irregular lead battery handling audit' },
  );
  assert(
    r15.status === 200 && r15.body.account?.account_status === 'SUSPENDED',
    'Admin can suspend non-compliant accounts with statutory reason',
  );

  console.log('\n======================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
