const { Pool, types } = require('pg');
require('dotenv').config();

// Ép pg driver hiểu 'timestamp without time zone' (OID 1114) trong DB là giờ Việt Nam (GMT+7)
types.setTypeParser(1114, function(stringValue) {
  // Thay thế khoảng trắng bằng 'T' (nếu có) để chuẩn format ISO 8601, sau đó cộng múi giờ +07:00
  return new Date(stringValue.replace(' ', 'T') + '+07:00');
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