const nodemailer = require('nodemailer');

const DEFAULT_USER_URL = 'https://user-frontend-chibo.vercel.app';

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const joinUrl = (baseUrl, path = '') => `${String(baseUrl).replace(/\/$/, '')}${path}`;

const getUserFrontendUrl = () => process.env.USER_FRONTEND_URL
    || process.env.FRONTEND_URL
    || DEFAULT_USER_URL;

const createTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'nckhsv.chibo@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password_here'
    }
});

const buildEmailHtml = ({ preview, label, title, greeting, message, details = [], notice, buttonText, buttonUrl }) => {
    const safeUrl = escapeHtml(buttonUrl);
    const detailRows = details.map(({ label: itemLabel, value, highlight }) => `
        <tr>
            <td style="padding:10px 12px;color:#6b625c;font-size:13px;vertical-align:top;width:38%;border-bottom:1px solid #ece7df;">${escapeHtml(itemLabel)}</td>
            <td style="padding:10px 12px;color:${highlight ? '#a91f23' : '#211c19'};font-size:${highlight ? '17px' : '14px'};font-weight:700;vertical-align:top;border-bottom:1px solid #ece7df;word-break:break-word;${highlight ? 'font-family:Consolas,Monaco,monospace;letter-spacing:.4px;' : ''}">${escapeHtml(value)}</td>
        </tr>
    `).join('');

    return `<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
        @media only screen and (max-width:620px) {
            .email-shell { width:100% !important; }
            .email-body { padding:26px 20px 30px !important; }
            .email-header { padding:24px 20px !important; }
            .email-title { font-size:25px !important; }
            .email-button { display:block !important; text-align:center !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background:#f3f0e9;color:#211c19;font-family:Arial,'Helvetica Neue',sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f0e9;">
        <tr>
            <td align="center" style="padding:28px 12px;">
                <table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 34px rgba(91,23,26,.12);">
                    <tr>
                        <td class="email-header" style="padding:28px 34px;background:#a91f23;border-bottom:5px solid #f1cf50;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td width="52" valign="middle">
                                        <div style="width:42px;height:42px;line-height:42px;text-align:center;border-radius:10px;background:#fff1aa;color:#a91f23;font-size:24px;font-weight:700;">★</div>
                                    </td>
                                    <td valign="middle" style="color:#ffffff;">
                                        <div style="font-size:16px;font-weight:700;line-height:1.35;">Hệ thống Quản lý Chi bộ</div>
                                        <div style="margin-top:3px;font-size:12px;color:#fff1aa;letter-spacing:.4px;">TRƯỜNG ĐẠI HỌC KỸ THUẬT – CÔNG NGHỆ CẦN THƠ</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-body" style="padding:34px 38px 38px;">
                            <div style="color:#a91f23;font-size:12px;font-weight:700;letter-spacing:1.2px;">${escapeHtml(label)}</div>
                            <h1 class="email-title" style="margin:8px 0 20px;color:#211c19;font-size:29px;line-height:1.25;letter-spacing:-.4px;">${escapeHtml(title)}</h1>
                            <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">${escapeHtml(greeting)}</p>
                            <p style="margin:0 0 22px;color:#554c47;font-size:15px;line-height:1.7;">${escapeHtml(message)}</p>
                            ${details.length ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;background:#faf8f3;border:1px solid #e7dfd3;border-radius:10px;border-collapse:separate;overflow:hidden;">
                                ${detailRows}
                            </table>` : ''}
                            ${notice ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px;background:#fff8d9;border-left:4px solid #e4bd2f;border-radius:6px;">
                                <tr><td style="padding:14px 16px;color:#5c4712;font-size:14px;line-height:1.6;"><strong>Lưu ý:</strong> ${escapeHtml(notice)}</td></tr>
                            </table>` : ''}
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding:2px 0 18px;">
                                        <a class="email-button" href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 26px;background:#f1cf50;color:#8b1517;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;line-height:1.2;box-shadow:0 5px 14px rgba(169,31,35,.18);">${escapeHtml(buttonText)} →</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0;color:#7a7069;font-size:12px;line-height:1.6;">Nếu nút không mở được, hãy sao chép đường dẫn sau vào trình duyệt:</p>
                            <p style="margin:5px 0 25px;font-size:12px;line-height:1.6;word-break:break-all;"><a href="${safeUrl}" style="color:#a91f23;text-decoration:underline;">${safeUrl}</a></p>
                            <p style="margin:0;color:#554c47;font-size:14px;line-height:1.6;">Trân trọng,<br><strong style="color:#211c19;">Ban Quản trị Hệ thống</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:17px 24px;background:#2c2521;color:#d8d0c8;text-align:center;font-size:11px;line-height:1.55;">Đây là email tự động. Vui lòng không trả lời hoặc chia sẻ thông tin đăng nhập trong email này.</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const sender = process.env.EMAIL_USER || 'nckhsv.chibo@gmail.com';
        const info = await createTransporter().sendMail({
            from: `"Hệ thống Quản lý Chi bộ" <${sender}>`,
            to,
            subject,
            text,
            html
        });
        console.log(`[email] Đã gửi "${subject}" tới ${to}: ${info.response}`);
        return true;
    } catch (error) {
        console.error(`[email] Không thể gửi tới ${to}:`, error.message);
        return false;
    }
};

const sendAccountCreationEmail = async (email, hoTen, username, password) => {
    const loginUrl = joinUrl(getUserFrontendUrl(), '/login');
    const subject = 'Tài khoản Đảng viên của đồng chí đã được cấp';

    return sendEmail({
        to: email,
        subject,
        text: `Kính gửi đồng chí ${hoTen},\n\nTài khoản Đảng viên đã được cấp.\nTên đăng nhập: ${username}\nMật khẩu tạm: ${password}\n\nĐăng nhập tại: ${loginUrl}\nVui lòng đổi mật khẩu ngay trong lần đăng nhập đầu tiên.`,
        html: buildEmailHtml({
            preview: 'Tài khoản Đảng viên đã được cấp. Xem thông tin đăng nhập và mở hệ thống.',
            label: 'CẤP TÀI KHOẢN',
            title: 'Tài khoản của đồng chí đã sẵn sàng',
            greeting: `Kính gửi đồng chí ${hoTen},`,
            message: 'Hồ sơ và tài khoản Đảng viên của đồng chí đã được tạo trên hệ thống.',
            details: [
                { label: 'Tên đăng nhập', value: username },
                { label: 'Mật khẩu tạm', value: password, highlight: true }
            ],
            notice: 'Hãy đăng nhập bằng mật khẩu tạm và đặt mật khẩu cá nhân mới ngay ở lần đăng nhập đầu tiên.',
            buttonText: 'Mở trang đăng nhập',
            buttonUrl: loginUrl
        })
    });
};

const sendPasswordResetEmail = async (email, hoTen, username, newPassword) => {
    const loginUrl = joinUrl(getUserFrontendUrl(), '/login');
    const subject = 'Mật khẩu tài khoản Đảng viên đã được cấp lại';

    return sendEmail({
        to: email,
        subject,
        text: `Kính gửi đồng chí ${hoTen},\n\nMật khẩu tài khoản đã được cấp lại.\nTên đăng nhập: ${username}\nMật khẩu tạm mới: ${newPassword}\n\nĐăng nhập tại: ${loginUrl}\nVui lòng đổi mật khẩu ngay sau khi đăng nhập.`,
        html: buildEmailHtml({
            preview: 'Mật khẩu tạm mới của tài khoản Đảng viên và đường dẫn đăng nhập.',
            label: 'KHÔI PHỤC TÀI KHOẢN',
            title: 'Mật khẩu của đồng chí đã được cấp lại',
            greeting: `Kính gửi đồng chí ${hoTen},`,
            message: 'Hệ thống đã tạo mật khẩu tạm mới cho tài khoản của đồng chí.',
            details: [
                { label: 'Tên đăng nhập', value: username },
                { label: 'Mật khẩu tạm mới', value: newPassword, highlight: true }
            ],
            notice: 'Chỉ sử dụng mật khẩu này để đăng nhập một lần và đổi sang mật khẩu cá nhân ngay sau đó.',
            buttonText: 'Đăng nhập và đổi mật khẩu',
            buttonUrl: loginUrl
        })
    });
};

const sendTransferReminderEmail = async (email, hoTen) => {
    const transferUrl = joinUrl(getUserFrontendUrl(), '/transfer-requests/new');
    const subject = 'Nhắc chuẩn bị hồ sơ chuyển Đảng chính thức';

    return sendEmail({
        to: email,
        subject,
        text: `Kính gửi đồng chí ${hoTen},\n\nHệ thống ghi nhận đồng chí sắp đủ 12 tháng dự bị kể từ ngày kết nạp. Vui lòng mở hệ thống và tạo yêu cầu chuyển chính thức để nộp hồ sơ đúng hạn.\n\nMở hồ sơ tại: ${transferUrl}`,
        html: buildEmailHtml({
            preview: 'Đồng chí sắp đủ 12 tháng dự bị. Vui lòng chuẩn bị hồ sơ chuyển chính thức.',
            label: 'NHẮC VIỆC',
            title: 'Chuẩn bị hồ sơ chuyển Đảng chính thức',
            greeting: `Kính gửi đồng chí ${hoTen},`,
            message: 'Hệ thống ghi nhận đồng chí sắp đủ 12 tháng dự bị kể từ ngày kết nạp Đảng.',
            details: [
                { label: 'Việc cần thực hiện', value: 'Tạo yêu cầu chuyển chính thức' },
                { label: 'Thời điểm', value: 'Thực hiện sớm để Chi ủy kịp xét duyệt' }
            ],
            notice: 'Sau khi mở hệ thống, chọn loại yêu cầu “Chuyển chính thức” và bổ sung đầy đủ hồ sơ.',
            buttonText: 'Tạo hồ sơ chuyển Đảng',
            buttonUrl: transferUrl
        })
    });
};

module.exports = {
    sendAccountCreationEmail,
    sendPasswordResetEmail,
    sendTransferReminderEmail
};
