const db = require('./ADMIN/backend/config/db');

async function patch() {
    try {
        console.log("Renaming dia_chi_hien_tai to dia_chi_thuong_tru...");
        await db.query('ALTER TABLE public.dangvien RENAME COLUMN dia_chi_hien_tai TO dia_chi_thuong_tru');
    } catch(e) {
        console.log("Error renaming:", e.message);
    }

    try {
        console.log("Adding dia_chi_tam_tru...");
        await db.query('ALTER TABLE public.dangvien ADD COLUMN dia_chi_tam_tru VARCHAR');
    } catch(e) {
        console.log("Error adding tam tru:", e.message);
    }

    try {
        console.log("Adding dia_chi_chi_bo_lien_he...");
        await db.query('ALTER TABLE public.dangvien ADD COLUMN dia_chi_chi_bo_lien_he VARCHAR');
    } catch(e) {
        console.log("Error adding chi bo lien he:", e.message);
    }
    
    console.log("DB patch completed!");
    process.exit(0);
}

patch();
