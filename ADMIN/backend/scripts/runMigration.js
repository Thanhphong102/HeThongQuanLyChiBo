const fs = require('fs');
const path = require('path');
const db = require('../config/db');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const runMigration = async () => {
    try {
        console.log('Bắt đầu chạy migration cho Task 7 & 8...');
        const sqlPath = path.join(__dirname, '../migrations/task7_8_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await db.query(sql);
        console.log('✅ Migration thành công: Đã thêm các cột vào database!');
    } catch (error) {
        console.error('❌ Lỗi khi chạy migration:', error);
    } finally {
        process.exit();
    }
};

runMigration();
