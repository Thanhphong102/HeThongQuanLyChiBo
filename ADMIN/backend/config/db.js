const { Pool, types } = require('pg');
require('dotenv').config();

// Ép pg driver hiểu 'timestamp without time zone' (OID 1114) trong DB là giờ Việt Nam (GMT+7)
types.setTypeParser(1114, function(stringValue) {
  // Thay thế khoảng trắng bằng 'T' (nếu có) để chuẩn format ISO 8601, sau đó cộng múi giờ +07:00
  return new Date(stringValue.replace(' ', 'T') + '+07:00');
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

pool.on('connect', () => {
  console.log('🔗 Đã kết nối tới Supabase PostgreSQL');
});

// Supabase/PgBouncer có thể chủ động đóng một kết nối đang nhàn rỗi.
// Nếu không lắng nghe sự kiện này, EventEmitter của pg sẽ làm sập toàn bộ
// tiến trình Node dù request hiện tại không hề bị lỗi.
pool.on('error', (error) => {
  console.error('[PostgreSQL pool] Kết nối nhàn rỗi đã bị đóng:', {
    code: error.code,
    message: error.message,
  });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
