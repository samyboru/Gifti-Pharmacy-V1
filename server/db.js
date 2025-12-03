// File Location: server/db.js

const { Pool } = require('pg');

// In a real production app, these values should come from environment variables (.env file)
const pool = new Pool({
  user: 'postgres',        // e.g., 'postgres'
  host: 'localhost',
  database: 'pharmacy_db',
  password: 'sami1234', // The password you set for your user
  port: 5432,
});

// Export the pool so other files can use it to query the database
module.exports = pool;