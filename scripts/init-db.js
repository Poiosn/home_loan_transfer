// scripts/init-db.js — run once on first deploy: `npm run init-db`
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
  });
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✓ Database initialized');
  } catch (e) {
    console.error('✗ DB init failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
