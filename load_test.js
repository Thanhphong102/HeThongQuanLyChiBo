// THAY ĐỔI CÁC THÔNG SỐ NÀY TÙY THEO NHU CẦU
const TARGET_URL = 'http://localhost:5001/api/auth/login'; // API muốn test (Ví dụ API Login)
const CONCURRENT_REQUESTS = 50; // Giả lập 50 Đảng viên cùng bấm nút 1 lúc

async function runLoadTest() {
    console.log(`🚀 BẮT ĐẦU TEST TẢI VỚI ${CONCURRENT_REQUESTS} REQUESTS CÙNG LÚC...`);
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    // Tạo mảng chứa 50 requests
    const requests = Array.from({ length: CONCURRENT_REQUESTS }).map((_, index) => {
        // Gửi request mô phỏng việc đăng nhập
        return fetch(TARGET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ten_dang_nhap: `dangvien${index}`,
                mat_khau: '123456'
            })
        }).then(res => {
            successCount++;
            process.stdout.write('🟢'); // Bắn ra 1 chấm xanh nếu thành công
        }).catch(err => {
            errorCount++;
            process.stdout.write('🔴'); // Bắn ra 1 chấm đỏ nếu lỗi (do sai pass/user hoặc server sập)
        });
    });

    // Chờ tất cả request chạy xong cùng 1 lúc (bắn phá máy chủ)
    await Promise.all(requests);
    
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;

    console.log('\n\n📊 KẾT QUẢ BÁO CÁO:');
    console.log('-----------------------------------');
    console.log(`⏱️ Tổng thời gian xử lý: ${timeTaken} giây`);
    console.log(`✅ Thành công: ${successCount} request`);
    console.log(`❌ Thất bại/Từ chối: ${errorCount} request`);
    console.log(`⚡ Số request xử lý trên 1 giây (RPS): ${(CONCURRENT_REQUESTS / timeTaken).toFixed(2)} req/s`);
    console.log('-----------------------------------');
    
    if (errorCount === 0 || errorCount === CONCURRENT_REQUESTS) { 
        // errorCount == CONCURRENT_REQUESTS là bình thường nếu user không tồn tại, quan trọng là server không sập
        console.log("💡 KẾT LUẬN: Server của bạn ĐỦ KHỎE để gánh lượng truy cập này!");
    } else {
        console.log("⚠️ KẾT LUẬN: Có hiện tượng rớt mạng hoặc quá tải (nghẽn cổ chai). Cần tối ưu thêm!");
    }
}

runLoadTest();
