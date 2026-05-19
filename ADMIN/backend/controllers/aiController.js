const db = require('../config/db');

/**
 * POST /api/ai/parse-member
 * Nhận rawText, dùng Groq AI (Llama 3) trích xuất thông tin Đảng viên.
 */
const parseMemberFromText = async (req, res) => {
  const { rawText } = req.body;

  if (!rawText || rawText.trim() === '') {
    return res.status(400).json({ message: 'Vui lòng cung cấp nội dung văn bản (rawText).' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return res.status(500).json({ message: 'GROQ_API_KEY chưa được cấu hình. Vui lòng thêm API Key vào file .env của backend.' });
  }

  const systemPrompt = `Bạn là một trợ lý trích xuất dữ liệu. 
QUY TẮC BẮT BUỘC:
- CHỈ trả về JSON object thuần túy, KHÔNG markdown, KHÔNG giải thích.
- Nếu không tìm thấy, đặt giá trị null.
- Các trường ngày tháng (ngaySinh, ngayVaoDang) định dạng YYYY-MM-DD.
- Các trường: hoTen, mssv, lop, dienThoai, email, ngaySinh, ngayVaoDang, queQuan, diaChiHienTai, gioiTinh ("Nam" hoặc "Nữ").`;

  const userPrompt = `VĂN BẢN CẦN PHÂN TÍCH:\n---\n${rawText}\n---\nJSON OUTPUT:`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Lỗi từ Groq API');
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content.trim();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      return res.status(500).json({ message: 'AI không thể phân tích văn bản này.', details: responseText });
    }

    return res.json({ success: true, data: parsed, model: 'llama-3.3-70b-versatile' });
  } catch (error) {
    console.error(`[AI] Lỗi khi gọi Groq API:`, error.message);
    return res.status(500).json({ message: 'Lỗi kết nối AI: ' + error.message });
  }
};

/**
 * POST /api/ai/chat
 * Chatbot hỗ trợ Đảng viên - Truy vấn ĐỘNG dữ liệu thực tế từ Database
 */
const chatWithBot = async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Vui lòng nhập câu hỏi.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return res.status(500).json({ message: 'GROQ_API_KEY chưa được cấu hình. Vui lòng thêm API Key vào file .env của backend.' });
  }

  // ============================================================
  // BƯỚC 1: TRUY VẤN DỮ LIỆU THỰC TẾ TỪ DATABASE
  // ============================================================
  const branchId = req.user?.branchId;
  let dynamicKnowledge = '';

  try {
    // 1a. Lấy danh sách Chi ủy của Chi bộ Đảng viên đang hỏi (lọc linh hoạt)
    let chiUyText = 'Hệ thống chưa ghi nhận thông tin Chi ủy của Chi bộ này. Vui lòng liên hệ trực tiếp với Chi ủy để được hỗ trợ.';
    if (branchId) {
      const chiUyRes = await db.query(
        `SELECT ho_ten, so_dien_thoai, email, chuc_vu_dang
         FROM "dangvien"
         WHERE ma_chi_bo = $1
           AND hoat_dong = true
           AND chuc_vu_dang IS NOT NULL
           AND chuc_vu_dang <> ''
           AND LOWER(chuc_vu_dang) NOT IN ('dang vien', 'đảng viên')
         ORDER BY ma_dang_vien ASC`,
        [branchId]
      );
      if (chiUyRes.rows.length > 0) {
        chiUyText = chiUyRes.rows.map((c, i) =>
          `**${i + 1}. Đ/c ${c.ho_ten}**\n- Chức vụ: ${c.chuc_vu_dang}\n- SĐT: ${c.so_dien_thoai || 'Chưa cập nhật'}\n- Email: ${c.email || 'Chưa cập nhật'}`
        ).join('\n\n');
      }
    }

    // 1b. Lấy Sơ đồ tổ chức Đảng ủy từ bảng sodotochuc
    let orgText = 'Chưa có dữ liệu sơ đồ tổ chức.';
    const orgRes = await db.query('SELECT ho_ten, chuc_vu FROM "sodotochuc" ORDER BY thu_tu ASC, ma_so_do ASC');
    if (orgRes.rows.length > 0) {
      orgText = orgRes.rows.map(o => `- Đ/c ${o.ho_ten} — ${o.chuc_vu}`).join('\n');
    }

    // 1c. Lấy danh sách Quy trình Công tác Đảng từ bảng quytrinhdang
    let procText = 'Chưa có dữ liệu quy trình.';
    const procRes = await db.query('SELECT tieu_de, mo_ta, duong_dan_file FROM "quytrinhdang" ORDER BY thu_tu ASC');
    if (procRes.rows.length > 0) {
      procText = procRes.rows.map((p, i) => {
        let text = `${i + 1}. **${p.tieu_de}**\n   - Mô tả: ${p.mo_ta || 'Không có mô tả chi tiết.'}`;
        if (p.duong_dan_file) {
          text += `\n   - Xem biểu đồ/hình ảnh minh họa: ${p.duong_dan_file}`;
        }
        return text;
      }).join('\n\n');
    }

    dynamicKnowledge = `
=== DỮ LIỆU THỰC TẾ TỪ HỆ THỐNG (CẬP NHẬT THEO THỜI GIAN THỰC) ===

[A] BAN CHI ỦY CỦA CHI BỘ ĐẢNG VIÊN (đây là Chi bộ trực tiếp của người đang hỏi):
${chiUyText}

[B] SƠ ĐỒ TỔ CHỨC CẤP ĐẢNG ỦY TRƯỜNG (cấp trên - KHÔNG PHẢI chi bộ của người đang hỏi):
${orgText}

[C] QUY TRÌNH CÔNG TÁC ĐẢNG:
${procText}
`;

    console.log('[AI-DB] Đã tải dữ liệu thực tế cho chatbot thành công.');
  } catch (dbErr) {
    console.error('[AI-DB] Lỗi truy vấn database:', dbErr.message);
    dynamicKnowledge = '\n[Lưu ý: Hệ thống tạm thời không thể kết nối cơ sở dữ liệu. Trả lời dựa trên kiến thức chung về công tác Đảng.]\n';
  }

  // ============================================================
  // BƯỚC 2: TRUYỀN DỮ LIỆU VÀO AI VÀ GỌI GROQ
  // ============================================================
  const systemInstruction = `Bạn là "Trợ lý ảo Chi bộ", một trợ lý AI thông minh, thân thiện và chuyên nghiệp, được tích hợp vào Hệ thống Quản lý Chi bộ Đảng.
Nhiệm vụ: Giải đáp các thắc mắc của Đảng viên về công tác Đảng, thông tin liên hệ Chi ủy, sơ đồ tổ chức và các quy trình.

QUY TẮC TRẢ LỜI BẮT BUỘC:
1. Khi người dùng hỏi về "Bí thư chi bộ", "Phó Bí thư chi bộ", "Chi ủy" hoặc thông tin liên hệ — CHỈ dùng dữ liệu trong mục [A]. TUYỆT ĐỐI KHÔNG dùng dữ liệu từ mục [B] để trả lời câu hỏi về chi bộ. Mục [B] là cấp Đảng ủy trường, KHÔNG PHẢI chi bộ của người đang hỏi.
2. Nếu mục [A] không có dữ liệu hoặc báo "Hệ thống chưa ghi nhận" → hãy trả lời thẳng thắn rằng hệ thống chưa cập nhật thông tin Chi ủy Chi bộ này, và đề nghị liên hệ trực tiếp Chi ủy. KHÔNG được dùng dữ liệu mục [B] thay thế.
3. Mục [B] chỉ dùng khi người hỏi hỏi cụ thể về "Đảng ủy trường", "Ban Giám hiệu", "sơ đồ tổ chức Đảng ủy" hoặc cấp trên chi bộ.
4. TUYỆT ĐỐI KHÔNG tự sáng tác ra số điện thoại, email, tên người không có trong dữ liệu.
5. Nếu quy trình có đường dẫn ảnh/biểu đồ, hãy gợi ý người dùng bấm vào xem.
6. Xưng hô "đồng chí" hoặc "bạn". Tự xưng là "trợ lý".
7. Dùng Markdown: **in đậm** tiêu đề, - gạch đầu dòng cho dễ đọc.

${dynamicKnowledge}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: message }
        ],
        temperature: 0.6
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Lỗi từ Groq API');
    }

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    return res.json({ success: true, reply: reply, model: 'llama-3.3-70b-versatile' });
  } catch (error) {
    console.error(`[AI] Lỗi khi gọi Groq API:`, error.message);
    return res.status(500).json({ message: 'Xin lỗi, có lỗi hệ thống xảy ra khi kết nối với AI. (' + error.message + ')' });
  }
};

module.exports = { parseMemberFromText, chatWithBot };
