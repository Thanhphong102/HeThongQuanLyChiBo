require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "TransferGuidelines" (
                id SERIAL PRIMARY KEY,
                ma_chi_bo VARCHAR(50) NOT NULL,
                loai_chuyen VARCHAR(100) NOT NULL,
                noi_dung TEXT,
                documents JSONB DEFAULT '[]',
                UNIQUE(ma_chi_bo, loai_chuyen)
            );
        `);
        console.log("Table created successfully");
    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
}

createTable();
