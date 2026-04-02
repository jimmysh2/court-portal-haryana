const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://user:123456@127.0.0.1:5432/court_portal'
});
console.log('Connecting to database...');
client.connect()
  .then(() => {
    console.log('Connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });
