đường link để tôi setting các biến á 
Vercel (Frontend): Nó đang tự động lấy code mới từ Github về để build lại. TUY NHIÊN, BẠN CẦN LÀM BƯỚC NÀY ĐỂ WEB CHẠY ĐƯỢC:

Vào trang Vercel của dự án ADMIN, chọn mục Settings -> Environment Variables.
Thêm biến tên là: REACT_APP_API_URL
Giá trị (Value): https://admin-backend-chibo.onrender.com/api
(Làm tương tự cho dự án SUPERADMIN với Value là link của superadmin backend).
Lưu ý: Thêm biến xong, bạn cần bấm Deploy lại 1 lần trên Vercel để nó nhận biến mới nhé.
Render (Backend): Nếu bạn cài đặt Auto Deploy trên Render thì nó đang tự động build lại rồi. Nếu không, bạn chỉ cần vào Render, bấm nút Manual Deploy -> Deploy latest commit là xong.
để tôi làm những nhiệm vụ cài đặt này nè