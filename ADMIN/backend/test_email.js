require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
    try {
        console.log("Đang thử gửi email tới thanhphongtaetae3012@gmail.com...");
        console.log("EMAIL_USER =", process.env.EMAIL_USER);
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000
        });

        await transporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: 'thanhphongtaetae3012@gmail.com',
            subject: 'Test Email',
            text: 'Hello world'
        });
        
        console.log("✅ Gửi email thành công!");
    } catch (e) {
        console.error("❌ Lỗi gửi email:", e.message);
    } finally {
        process.exit();
    }
})();
