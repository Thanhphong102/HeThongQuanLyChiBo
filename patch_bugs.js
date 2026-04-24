const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    replacements.forEach(r => {
        modified = modified.replace(r.search, r.replace);
    });
    if (modified !== content) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`Patched: ${filePath}`);
    }
}

// 1. hoatdong -> hoat_dong
const memberControllers = [
    'D:\\NCKHSV\\ADMIN\\backend\\controllers\\branchMemberController.js',
    'D:\\NCKHSV\\ADMIN\\backend\\controllers\\authController.js',
    'D:\\NCKHSV\\ADMIN\\backend\\controllers\\branchDashboardController.js',
    'D:\\NCKHSV\\ADMIN\\backend\\controllers\\branchFeeController.js',
    'D:\\NCKHSV\\SUPERADMIN\\backend\\controllers\\memberController.js',
    'D:\\NCKHSV\\SUPERADMIN\\backend\\controllers\\authController.js',
    'D:\\NCKHSV\\USER\\src\\api\\userApi.js',
    'D:\\NCKHSV\\ADMIN\\frontend\\src\\pages\\AccountManager.js',
    'D:\\NCKHSV\\SUPERADMIN\\frontend\\src\\pages\\AccountManager.js'
];

memberControllers.forEach(file => {
    replaceInFile(file, [
        { search: /hoatdong /g, replace: 'hoat_dong ' },
        { search: /hoatdong=/g, replace: 'hoat_dong=' },
        { search: /hoatdong =/g, replace: 'hoat_dong =' },
        { search: /hoatdong:/g, replace: 'hoat_dong:' }
    ]);
});

// 2. newsController.js (SUPERADMIN)
replaceInFile('D:\\NCKHSV\\SUPERADMIN\\backend\\controllers\\newsController.js', [
    { search: /const \{ tieu_de, content \} = req.body;/g, replace: 'const { tieu_de, noi_dung } = req.body;' },
    { search: /WHERE id = /g, replace: 'WHERE ma_tin_tuc = ' }
]);

replaceInFile('D:\\NCKHSV\\SUPERADMIN\\frontend\\src\\pages\\NewsManager.js', [
    { search: /dataIndex: 'id'/g, replace: "dataIndex: 'ma_tin_tuc'" },
    { search: /record\.id/g, replace: "record.ma_tin_tuc" }
]);

// 3. branchFormController.js (ADMIN)
replaceInFile('D:\\NCKHSV\\ADMIN\\backend\\controllers\\branchFormController.js', [
    { search: /WHERE id = /g, replace: 'WHERE ma_bieu_mau = ' },
    { search: /const \{ id \} = req\.params/g, replace: 'const { id: ma_bieu_mau } = req.params' }
]);
replaceInFile('D:\\NCKHSV\\ADMIN\\frontend\\src\\pages\\FormManager.js', [
    { search: /record\.id/g, replace: "record.ma_bieu_mau" },
    { search: /dataIndex: 'id'/g, replace: "dataIndex: 'ma_bieu_mau'" }
]);

// 4. mediaController.js (ADMIN) & User Media
replaceInFile('D:\\NCKHSV\\ADMIN\\backend\\controllers\\mediaController.js', [
    { search: /WHERE id = /g, replace: 'WHERE ma_hinh_anh = ' },
    { search: /WHERE id=/g, replace: 'WHERE ma_hinh_anh=' }
]);
replaceInFile('D:\\NCKHSV\\ADMIN\\frontend\\src\\components\\ImageGallery.js', [
    { search: /item\.id/g, replace: "item.ma_hinh_anh" }
]);
replaceInFile('D:\\NCKHSV\\ADMIN\\frontend\\src\\components\\VideoGallery.js', [
    { search: /item\.id/g, replace: "item.ma_hinh_anh" }
]);
replaceInFile('D:\\NCKHSV\\USER\\src\\pages\\Media\\MediaPage.jsx', [
    { search: /item\.id/g, replace: "item.ma_hinh_anh" },
    { search: /key=\{item\.id\}/g, replace: "key={item.ma_hinh_anh}" }
]);

// 5. landingController.js (SUPERADMIN)
replaceInFile('D:\\NCKHSV\\SUPERADMIN\\backend\\controllers\\landingController.js', [
    { search: /ORDER BY thu_tu ASC, id ASC/g, replace: 'ORDER BY thu_tu ASC, ma_so_do ASC' },
    { search: /DELETE FROM "sodotochuc" WHERE id = /g, replace: 'DELETE FROM "sodotochuc" WHERE ma_so_do = ' },
    { search: /DELETE FROM "quytrinhdang" WHERE id = /g, replace: 'DELETE FROM "quytrinhdang" WHERE ma_quy_trinh = ' },
    { search: /file_url/g, replace: 'duong_dan_file' }
]);
replaceInFile('D:\\NCKHSV\\SUPERADMIN\\frontend\\src\\pages\\LandingManager.js', [
    { search: /member\.id/g, replace: "member.ma_so_do" },
    { search: /record\.id/g, replace: "record.ma_quy_trinh" },
    { search: /dataIndex: 'id'/g, replace: "dataIndex: 'ma_quy_trinh'" }
]);

// Mở rộng frontend landing của user
replaceInFile('D:\\NCKHSV\\USER\\src\\pages\\Landing\\LandingPage.jsx', [
    { search: /item\.id/g, replace: "item.ma_tin_tuc" },
    { search: /member\.id/g, replace: "member.ma_so_do" }
]);

console.log("PATCH COMPLETE");
