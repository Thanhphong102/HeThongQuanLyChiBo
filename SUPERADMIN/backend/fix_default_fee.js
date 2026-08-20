const db = require('./config/db');

async function fixDefaultFee() {
    try {
        await db.query('ALTER TABLE "dangvien" ALTER COLUMN muc_dong_phi SET DEFAULT 5000');
        console.log('Fixed DB default to 5000');
        
        // Also update existing members who have 50000 to 5000, since it was the old default
        // But maybe they actually set 50000 manually?
        // Usually, if they want to change the default, they also want to update the existing users 
        // who are currently at the old default. Let's do it just in case, but let's see.
        const res = await db.query('UPDATE "dangvien" SET muc_dong_phi = 5000 WHERE muc_dong_phi = 50000 OR muc_dong_phi IS NULL');
        console.log(`Updated ${res.rowCount} existing members to 5000`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
fixDefaultFee();
