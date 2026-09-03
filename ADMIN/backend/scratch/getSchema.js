const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL environment variable');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
    try {
        let r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("== TABLES ==");
        console.log(r.rows);
        
        let c = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chitieu'");
        console.log("== chitieu ==");
        console.log(c.rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
