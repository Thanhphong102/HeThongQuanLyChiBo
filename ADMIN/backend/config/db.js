const { Pool, types } = require('pg');
require('dotenv').config();

// Ép pg driver hiểu 'timestamp without time zone' (OID 1114) trong DB là giờ UTC
types.setTypeParser(1114, function(stringValue) {
  return new Date(stringValue + 'Z');
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('🔗 Đã kết nối tới Supabase PostgreSQL');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};