const fs = require("fs");
let text = fs.readFileSync("Bao_cao_NCKH.txt", "utf8");

// We only want to replace section headers that start with 2.5, 2.6, 2.7
// It could be 2.5. or 2.5.1.
// In the text, lines start with these numbers. So we look for \n2.7.
text = text.replace(/\n2\.7\.(?=\s|\d)/g, "\n2.8.");
text = text.replace(/\n2\.6\.(?=\s|\d)/g, "\n2.7.");
text = text.replace(/\n2\.5\.(?=\s|\d)/g, "\n2.6.");

const newSectionContent = `2.5. PHÂN TÍCH NGHI?P V? VÀ L?A CH?N KI?N TRÚC
2.5.1. Phân tích nghi?p v? tru?c khi dua ra gi?i pháp
Tru?c khi thi?t k? h? th?ng, nhóm nghiên c?u dã ti?n hành kh?o sát th?c tr?ng công tác qu?n lý chi b? t?i Tru?ng Ð?i h?c K? thu?t - Công ngh? C?n Tho. Th?c tr?ng cho th?y các b?t c?p sau:
- Qu?n lý h? so và bi?n d?ng Ð?ng viên: Hi?n t?i vi?c luu tr? lý l?ch trích ngang, theo dõi th?i gian chuy?n Ð?ng chính th?c hay sinh ho?t phí ch? y?u làm trên Excel ho?c s? sách th? công. Vi?c này d? d?n d?n sai sót, ch?m tr? trong vi?c nh?c nh? các m?c th?i gian quan tr?ng (ví d? h?t 12 tháng d? b?).
- Sinh ho?t và di?m danh: Ði?m danh qua gi?y ho?c qua bi?u m?u Google Form d? x?y ra tình tr?ng "di?m danh h?", không d?m b?o tính k? lu?t và s? hi?n di?n th?c t? c?a Ð?ng viên trong các bu?i sinh ho?t chuyên d?.
- Qu?n lý minh ch?ng và ch? tiêu: Ð?ng ?y giao ch? tiêu xu?ng Chi b?, nhung vi?c báo cáo ti?n d? và n?p minh ch?ng (hình ?nh tham gia phong trào, ngh? quy?t) chua có h? th?ng t?p trung. Minh ch?ng g?i qua Zalo/Email d? trôi tin và khó th?m d?nh tính xác th?c c?a hình ?nh.
T? nh?ng bài toán nghi?p v? trên, h? th?ng c?n m?t gi?i pháp công ngh? có kh? nang: s? hóa h? so, t? d?ng nh?c nh?, ch?ng gian l?n di?m danh (qua t?a d?), ch?ng gian l?n minh ch?ng (qua phân tích siêu d? li?u ?nh), và cung c?p dashboard th?ng kê th?i gian th?c cho c?p lãnh d?o.

2.5.2. So sánh phuong án thi?t k? và l?a ch?n ki?n trúc
a) L?a ch?n ki?n trúc t?ng th? (Architecture)
- Phuong án 1: Ki?n trúc Monolithic truy?n th?ng (Giao di?n và Logic nghi?p v? n?m chung m?t kh?i code). Uu di?m: D? phát tri?n ban d?u. Nhu?c di?m: Khó m? r?ng, n?u m?t module (ví d? module di?m danh) quá t?i s? làm s?p toàn b? h? th?ng.
- Phuong án 2: Ki?n trúc tách r?i Frontend - Backend qua RESTful API, tri?n khai d?c l?p (Multi-tier Architecture). Uu di?m: Phân tách rõ ràng gi?a giao di?n và x? lý d? li?u, d? b?o trì, tính s?n sàng cao (Graceful Degradation).
=> Quy?t d?nh: Nhóm ch?n Phuong án 2, thi?t k? h? th?ng tách bi?t thành Frontend (ReactJS) và Backend (NodeJS/Express). Ði?u này phù h?p v?i mô hình 3 actor (SuperAdmin, Admin, User), giúp cách ly d? li?u và b?o m?t lu?ng truy c?p d?c l?p.

b) L?a ch?n H? qu?n tr? Co s? d? li?u
- Phuong án 1: Co s? d? li?u phi quan h? (NoSQL - MongoDB). Phù h?p v?i d? li?u phi c?u trúc, linh ho?t.
- Phuong án 2: Co s? d? li?u quan h? (RDBMS - PostgreSQL). H? tr? ACID, ràng bu?c khóa ngo?i ch?t ch?.
=> Quy?t d?nh: Qu?n lý Ð?ng viên, Chi b?, Ch? tiêu và Thu/Chi Ð?ng phí là các th?c th? có m?i quan h? ràng bu?c kh?t khe (Relational). C?n tính toàn v?n d? li?u c?c cao (không th? x?y ra tình tr?ng thi?u d? li?u cha). Do dó, PostgreSQL du?c l?a ch?n làm h? qu?n tr? co s? d? li?u chính.

c) L?a ch?n gi?i pháp di?m danh ch?ng gian l?n
- Phuong án 1: Ch? dùng mã QR tinh ho?c danh sách di?m danh truy?n th?ng. Nhu?c di?m: Ð?ng viên có th? ch?p ?nh QR g?i cho ngu?i khác quét, không xác th?c du?c v? trí th?c t?.
- Phuong án 2: Hybrid Attendance (Mã QR d?ng + Xác th?c Geolocation).
=> Quy?t d?nh: L?a ch?n Phuong án 2. H? th?ng t?o mã QR d?ng (thay d?i m?i 100 giây) k?t h?p v?i thu?t toán tính kho?ng cách Haversine t? t?a d? GPS c?a thi?t b? d?n tâm h?i tru?ng. Gi?i pháp này tri?t tiêu hoàn toàn kh? nang di?m danh h?.

d) L?a ch?n gi?i pháp luu tr? tài li?u (Storage)
- Phuong án 1: Luu tr? file tr?c ti?p trên ? c?ng máy ch? Backend (Local Storage). T?n tài nguyên bang thông, d? tràn ? dia, chi phí duy trì server l?n.
- Phuong án 2: S? d?ng gi?i pháp Cloud Storage bên th? 3.
=> Quy?t d?nh: Ch?n Google Drive API làm Object Storage d? luu tr? van b?n và hình ?nh ho?t d?ng. Co s? d? li?u n?i b? ch? luu tr? d?nh danh (File ID), giúp h? th?ng ho?t d?ng mu?t mà, t?c d? t?i trang nhanh và t?n d?ng t?t tài nguyên dám mây mi?n phí cho giáo d?c.

e) Tích h?p Trí tu? nhân t?o (AI) trong phân tích d? li?u
- Khi nh?p li?u h? so Ð?ng viên m?i, thao tác th? công r?t t?n th?i gian. Thay vì dùng bi?u th?c chính quy (Regex) kém linh ho?t, h? th?ng quy?t d?nh tích h?p API c?a mô hình Llama 3 (qua n?n t?ng Groq). Mô hình LLM dóng vai trò x? lý ngôn ng? t? nhiên, t? d?ng trích xu?t các th?c th? (Entity Extraction) t? m?t do?n mô t? thô (H? tên, quê quán, ngày vào Ð?ng) và di?n t? d?ng vào Form, c?i thi?n dáng k? nang su?t x? lý công vi?c hành chính.

`

text = text.replace("\n2.6. H? TH?NG", "\n" + newSectionContent + "2.6. H? TH?NG");

// Also add to TOC
const tocAddition = `2.5. PHÂN TÍCH NGHI?P V? VÀ L?A CH?N KI?N TRÚC25
2.5.1. Phân tích nghi?p v? tru?c khi dua ra gi?i pháp25
2.5.2. So sánh phuong án thi?t k? và l?a ch?n ki?n trúc25\n`;
text = text.replace("\n2.6. H? TH?NG", "\n" + tocAddition + "2.6. H? TH?NG"); // It will match the first occurrence which is in TOC

fs.writeFileSync("Bao_cao_NCKH_updated.txt", text);
console.log("Done");

