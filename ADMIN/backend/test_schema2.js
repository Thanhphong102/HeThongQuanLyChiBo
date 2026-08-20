require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'bieumau_folder'")
  .then(res => {
    console.log(res.rows.map(r => r.column_name));
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
