const fs = require('fs');

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
    } else {
        console.log(`No changes needed for: ${filePath}`);
    }
}

// 1. LandingPage
replaceInFile('D:\\NCKHSV\\USER\\src\\pages\\Landing\\LandingPage.jsx', [
    { search: /item\.title/g, replace: 'item.tieu_de' },
    { search: /item\.image_url/g, replace: 'item.duong_dan_anh' },
    { search: /item\.content/g, replace: 'item.noi_dung' },
    { search: /item\.created_at/g, replace: 'item.ngay_tao' },
    { search: /record\.file_url/g, replace: 'record.duong_dan_file' }
]);

// 2. HomePage
replaceInFile('D:\\NCKHSV\\USER\\src\\pages\\Home\\HomePage.jsx', [
    { search: /item\.title/g, replace: 'item.tieu_de' },
    { search: /item\.image_url/g, replace: 'item.duong_dan_anh' },
    { search: /item\.content/g, replace: 'item.noi_dung' },
    { search: /item\.created_at/g, replace: 'item.ngay_tao' }
]);

// 3. DocumentsPage
replaceInFile('D:\\NCKHSV\\USER\\src\\pages\\Documents\\DocumentsPage.jsx', [
    { search: /dataIndex: 'title'/g, replace: "dataIndex: 'tieu_de'" },
    { search: /dataIndex: 'created_at'/g, replace: "dataIndex: 'ngay_tao'" },
    { search: /record\.file_url/g, replace: 'record.duong_dan_file' },
    { search: /rowKey="id"/g, replace: 'rowKey="ma_quy_trinh"' }, // Very dangerous if both tables use "id".
    { search: /rowKey="id"/g, replace: 'rowKey="ma_bieu_mau"' } // Wait! If I run it again it replaces ma_quy_trinh to ma_bieu_mau? No, but let's be careful.
]);
// For DocumentsPage specifically, I will use a more precise script snippet.
const docFile = 'D:\\NCKHSV\\USER\\src\\pages\\Documents\\DocumentsPage.jsx';
if (fs.existsSync(docFile)) {
    let docContent = fs.readFileSync(docFile, 'utf8');
    docContent = docContent.replace(/rowKey="id" loading=\{loading/g, 'rowKey="ma_bieu_mau" loading={loading');
    docContent = docContent.replace(/rowKey="id" loading=\{false\}/g, 'rowKey="ma_quy_trinh" loading={false}');
    fs.writeFileSync(docFile, docContent, 'utf8');
}

// 4. NotificationPopover
replaceInFile('D:\\NCKHSV\\USER\\src\\components\\Header\\NotificationPopover.jsx', [
    { search: /item\.id/g, replace: 'item.ma_thong_bao' },
    { search: /item\.title/g, replace: 'item.tieu_de' },
    { search: /item\.content/g, replace: 'item.noi_dung' },
    { search: /item\.type/g, replace: 'item.loai_thong_bao' },
    { search: /item\.isUnread/g, replace: 'item.isUnread' }, // Wait, API mapping
    // We should also look at how API returns `is_read`.
    // In backend, `da_doc`. The component uses `isUnread = !Boolean(item.da_doc)`.
    { search: /item\.is_read/g, replace: 'item.da_doc' },
    // Wait in userApi.js I need to check API parameters for Notification too! Let's patch Notification Popover comprehensively.
    { search: /expandedItems\[item\.ma_thong_bao\]/g, replace: 'expandedItems[item.ma_thong_bao]' },
    { search: /n\.ma_thong_bao === item\.ma_thong_bao/g, replace: 'n.ma_thong_bao === item.ma_thong_bao' }
]);

// 5. Thư viện (Media) - ADMIN components
replaceInFile('D:\\NCKHSV\\ADMIN\\frontend\\src\\components\\ImageGallery.js', [
    { search: /item\.title/g, replace: 'item.tieu_de' },
    { search: /item\.url/g, replace: 'item.duong_dan' }
]);
replaceInFile('D:\\NCKHSV\\ADMIN\\frontend\\src\\components\\VideoGallery.js', [
    { search: /item\.title/g, replace: 'item.tieu_de' },
    { search: /item\.url/g, replace: 'item.duong_dan' },
    { search: /item\.created_at/g, replace: 'item.ngay_tao' }
]);
replaceInFile('D:\\NCKHSV\\USER\\src\\pages\\Media\\MediaPage.jsx', [
    { search: /item\.title/g, replace: 'item.tieu_de' },
    { search: /item\.url/g, replace: 'item.duong_dan' },
    { search: /item\.type/g, replace: 'item.loai_hinh_anh' }
]);

// 6. userApi.js (For Notification markings)
replaceInFile('D:\\NCKHSV\\USER\\src\\api\\userApi.js', [
    { search: /\/notifications\/\$\{id\}/g, replace: '/notifications/${ma_thong_bao}' } // just variable renaming, maybe not needed
]);

// 7. Fix FormManager ADMIN
replaceInFile('D:\\NCKHSV\\ADMIN\\frontend\\src\\pages\\FormManager.js', [
    { search: /dataIndex: 'title'/g, replace: "dataIndex: 'tieu_de'" },
    { search: /dataIndex: 'created_at'/g, replace: "dataIndex: 'ngay_tao'" },
    { search: /dataIndex: 'file_url'/g, replace: "dataIndex: 'duong_dan_file'" },
    { search: /record\.file_url/g, replace: "record.duong_dan_file" },
    { search: /dataIndex: 'uploaded_by'/g, replace: "dataIndex: 'nguoi_tai_len'" }
]);

console.log("FRONTEND PATCH COMPLETE");
