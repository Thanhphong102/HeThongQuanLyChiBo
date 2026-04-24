const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.inyjlautahmgkjtwwhnc:Nxtp10022001@&@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres' });
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
