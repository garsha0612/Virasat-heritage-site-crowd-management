async function testDatabaseOfflineHandling() {
  console.log('Testing API response when MongoDB is unreachable...');

  // Attempt login with dummy credentials
  const loginRes = await fetch('http://127.0.0.1:3009/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' }),
  });

  const loginData = await loginRes.json();
  console.log(`Login response status: ${loginRes.status}`);
  console.log(`Login response body:`, loginData);

  // Attempt registration with dummy credentials
  const regRes = await fetch('http://127.0.0.1:3009/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Offline Tester',
      email: 'offlinetest@example.com',
      password: 'Password123!',
    }),
  });

  const regData = await regRes.json();
  console.log(`Register response status: ${regRes.status}`);
  console.log(`Register response body:`, regData);
}

testDatabaseOfflineHandling().catch(console.error);
