const db = require('./config/db');
async function migrate() {
  try {
    await db.query(`ALTER TABLE "diemdanh" ADD COLUMN IF NOT EXISTS nguon_diem_danh VARCHAR(20) DEFAULT 'Thu cong'`);
    console.log('Migration OK: Column nguon_diem_danh added');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
}
migrate();
