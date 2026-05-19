require('dotenv').config();
const db = require('./config/db');
const bcrypt = require('bcrypt');
const emailService = require('./services/emailService');

(async () => {
    try {
        const id = 14;
        const userRes = await db.query('SELECT ho_ten, email, ten_dang_nhap FROM "dangvien" WHERE ma_dang_vien = $1', [id]);
        console.log('User:', userRes.rows[0]);
        const { ho_ten, email, ten_dang_nhap } = userRes.rows[0];

        const matKhauTam = 'Test1234@#';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(matKhauTam, salt);
        console.log('Hashed Password:', hashedPassword);

        await db.query('UPDATE "dangvien" SET mat_khau = $1 WHERE ma_dang_vien = $2', [hashedPassword, id]);
        console.log('Updated DB');

        console.log('Sending email...');
        await emailService.sendPasswordResetEmail(email, ho_ten, ten_dang_nhap, matKhauTam);
        console.log('Email sent done');
    } catch (e) {
        console.error('CRASH:', e);
    } finally {
        process.exit(0);
    }
})();
