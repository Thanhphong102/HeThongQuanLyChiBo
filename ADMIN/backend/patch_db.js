require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function patch() {
    try {
        console.log("Renaming dia_chi_hien_tai to dia_chi_thuong_tru...");
        await pool.query('ALTER TABLE public.dangvien RENAME COLUMN dia_chi_hien_tai TO dia_chi_thuong_tru');
        console.log("Success renaming!");
    } catch(e) {
        console.log("Error renaming:", e.message);
    }

    try {
        console.log("Adding dia_chi_tam_tru...");
        await pool.query('ALTER TABLE public.dangvien ADD COLUMN dia_chi_tam_tru VARCHAR');
        console.log("Success adding tam tru!");
    } catch(e) {
        console.log("Error adding tam tru:", e.message);
    }

    try {
        console.log("Adding dia_chi_chi_bo_lien_he...");
        await pool.query('ALTER TABLE public.dangvien ADD COLUMN dia_chi_chi_bo_lien_he VARCHAR');
        console.log("Success adding chi bo lien he!");
    } catch(e) {
        console.log("Error adding chi bo lien he:", e.message);
    }
    
    console.log("DB patch completed!");
    process.exit(0);
}

patch();
