const nodemailer = require('nodemailer');

const sendAccountCreationEmail = async (email, hoTen, username, password) => {
    try {
        // Cấu hình transporter (Nên dùng biến môi trường để bảo mật)
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Hoặc sử dụng host/port của SMTP server khác
            auth: {
                user: process.env.EMAIL_USER || 'nckhsv.chibo@gmail.com', 
                pass: process.env.EMAIL_PASS || 'your_app_password_here' 
            }
        });

        const mailOptions = {
            from: `"Hệ thống Quản lý Chi bộ" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'THÔNG BÁO CẤP TÀI KHOẢN ĐẢNG VIÊN MỚI',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #CE1126; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0; text-transform: uppercase;">Hệ Thống Quản Lý Chi Bộ</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Kính gửi đồng chí <strong>${hoTen}</strong>,</p>
                        <p>Hồ sơ và tài khoản Đảng viên của đồng chí trên hệ thống đã được cấp thành công.</p>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Thông tin đăng nhập:</strong></p>
                            <p style="margin: 5px 0;">- Tên đăng nhập: <strong>${username}</strong></p>
                            <p style="margin: 5px 0;">- Mật khẩu: <strong>${password}</strong></p>
                        </div>
                        <p style="color: #CE1126; font-weight: bold;">Lưu ý quan trọng:</p>
                        <p>Để đảm bảo an toàn thông tin cá nhân, yêu cầu đồng chí <strong>đổi mật khẩu ngay</strong> trong lần đăng nhập đầu tiên.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'https://user-frontend-chibo.vercel.app'}" 
                               style="background-color: #CE1126; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                ĐĂNG NHẬP VÀO HỆ THỐNG
                            </a>
                        </div>
                        
                        <br>
                        <p>Trân trọng,</p>
                        <p><strong>Ban Quản trị Hệ thống</strong></p>
                    </div>
                    <div style="background-color: #f1f1f1; color: #666; text-align: center; padding: 10px; font-size: 12px;">
                        Đây là email tự động, vui lòng không trả lời email này.
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendPasswordResetEmail = async (email, hoTen, username, newPassword) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'nckhsv.chibo@gmail.com', 
                pass: process.env.EMAIL_PASS || 'your_app_password_here' 
            }
        });

        const mailOptions = {
            from: `"Hệ thống Quản lý Chi bộ" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'THÔNG BÁO CẤP LẠI MẬT KHẨU TÀI KHOẢN ĐẢNG VIÊN',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0; text-transform: uppercase;">Cấp Lại Mật Khẩu</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Kính gửi đồng chí <strong>${hoTen}</strong>,</p>
                        <p>Mật khẩu tài khoản Đảng viên của đồng chí vừa được Ban Quản trị cấp lại thành công.</p>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Thông tin đăng nhập mới:</strong></p>
                            <p style="margin: 5px 0;">- Tên đăng nhập: <strong>${username}</strong></p>
                            <p style="margin: 5px 0;">- Mật khẩu mới: <strong style="color: #e11d48; font-size: 16px;">${newPassword}</strong></p>
                        </div>
                        <p style="color: #CE1126; font-weight: bold;">Lưu ý quan trọng:</p>
                        <p>Đồng chí vui lòng đăng nhập bằng mật khẩu mới này và <strong>đổi mật khẩu ngay lập tức</strong> để đảm bảo an toàn.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'https://user-frontend-chibo.vercel.app'}" 
                               style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                ĐĂNG NHẬP ĐỂ ĐỔI MẬT KHẨU
                            </a>
                        </div>

                        <br>
                        <p>Trân trọng,</p>
                        <p><strong>Ban Quản trị Hệ thống</strong></p>
                    </div>
                    <div style="background-color: #f1f1f1; color: #666; text-align: center; padding: 10px; font-size: 12px;">
                        Đây là email tự động, vui lòng không trả lời email này.
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Reset Password Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending reset email:', error);
        return false;
    }
};

const sendTransferReminderEmail = async (email, hoTen) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'nckhsv.chibo@gmail.com', 
                pass: process.env.EMAIL_PASS || 'your_app_password_here' 
            }
        });

        const mailOptions = {
            from: `"Hệ thống Quản lý Chi bộ" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'THÔNG BÁO NHẮC NHỞ LÀM HỒ SƠ CHUYỂN ĐẢNG CHÍNH THỨC',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #CE1126; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0; text-transform: uppercase;">Hệ Thống Quản Lý Chi Bộ</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Kính gửi đồng chí <strong>${hoTen}</strong>,</p>
                        <p>Hệ thống ghi nhận đồng chí đã sắp đến hạn 12 tháng dự bị kể từ ngày kết nạp Đảng.</p>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;">Đồng chí vui lòng <strong>truy cập hệ thống</strong> và tạo <strong>Yêu cầu chuyển sinh hoạt Đảng (Loại: Chuyển chính thức)</strong> để nộp hồ sơ xét duyệt kịp thời.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/transfer-requests/new" 
                               style="background-color: #CE1126; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                LÀM HỒ SƠ NGAY
                            </a>
                        </div>
                        
                        <br>
                        <p>Trân trọng,</p>
                        <p><strong>Ban Quản trị Hệ thống</strong></p>
                    </div>
                    <div style="background-color: #f1f1f1; color: #666; text-align: center; padding: 10px; font-size: 12px;">
                        Đây là email tự động, vui lòng không trả lời email này.
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Transfer Reminder Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending transfer reminder email:', error);
        return false;
    }
};

module.exports = {
    sendAccountCreationEmail,
    sendPasswordResetEmail,
    sendTransferReminderEmail
};
