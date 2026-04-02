const { Client } = require('pg');

async function test(user, password) {
  const client = new Client({
    connectionString: `postgresql://${user}:${password}@127.0.0.1:5433/court_portal`
  });
  console.log(`Testing ${user}:${password}...`);
  try {
    await client.connect();
    console.log(`✅ Success for ${user}:${password}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ Fail for ${user}:${password}: ${err.message}`);
    return false;
  }
}

async function run() {
  await test('user', '123456');
  await test('user', 'password');
  await test('postgres', '123456');
  await test('postgres', 'password');
}

run();
