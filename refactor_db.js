const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('BACKUP_SOURCE')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const allFiles = walk('D:\\NCKHSV');

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. DANG_KY_HOAT_DONG
    content = content.replace(/dangkyhoatdong/g, 'dangkyhoatdong');
    content = content.replace(/ma_hoat_dong/g, 'ma_hoat_dong');
    // ONLY replace dk.ma_dang_ky or similar specific aliases
    content = content.replace(/dk\.id(\s|,|;)/g, 'dk.ma_dang_ky$1');
    content = content.replace(/COUNT\(DISTINCT dk\.id\)/g, 'COUNT(DISTINCT dk.ma_dang_ky)');
    content = content.replace(/COUNT\(id\) FROM "dangkyhoatdong"/g, 'COUNT(ma_dang_ky) FROM "dangkyhoatdong"');

    // Mapping user_id safely for dangkyhoatdong
    // We will just replace user_id -> ma_dang_vien across backend queries if they belong to this context
    // Actually, user_id is mainly used in dangkyhoatdong.
    content = content.replace(/user_id(\s*=?\s*\$| =)/g, 'ma_dang_vien$1');
    content = content.replace(/dk\.user_id/g, 'dk.ma_dang_vien');

    // 2. HOAT_DONG
    content = content.replace(/"hoatdong"/g, '"hoatdong"');
    content = content.replace(/'hoatdong'/g, "'hoatdong'");
    content = content.replace(/ hoatdong /g, ' hoatdong ');

    // 3. MEDIA_LIBRARY (thuvienanh)
    content = content.replace(/thuvienanh/g, 'thuvienanh');
    content = content.replace(/loai_hinh_anh/g, 'loai_hinh_anh');
    // Only replace ma_chi_bo where it exists
    content = content.replace(/ma_chi_bo/g, 'ma_chi_bo');
    // We cannot blindly replace title, url, id, drive_file_id, created_at everywhere.
    // Replace them specifically in media context:
    if (file.includes('mediaController') || file.includes('MediaPage') || file.includes('Gallery') || file.includes('publicController')) {
        content = content.replace(/drive_file_id/g, 'ma_file_drive');
        content = content.replace(/created_at/g, 'ngay_tao');
        content = content.replace(/url,/g, 'duong_dan,');
        content = content.replace(/url\b(?!\()/g, 'duong_dan');
        content = content.replace(/title/g, 'tieu_de');
        // id -> ma_hinh_anh
        content = content.replace(/\.id/g, '.ma_hinh_anh');
        content = content.replace(/\{ id,/g, '{ ma_hinh_anh,');
        content = content.replace(/\{ id /g, '{ ma_hinh_anh ');
        // rollback req.params.id context safely if needed
        content = content.replace(/req\.params\.ma_hinh_anh/g, 'req.params.id');
        content = content.replace(/const { ma_hinh_anh } = req\.params/g, 'const { id } = req.params');
        // rollback user.id
        content = content.replace(/user\.ma_hinh_anh/g, 'user.id');
    }

    // 4. NEWS (tintuc)
    content = content.replace(/"tintuc"/g, '"tintuc"');
    content = content.replace(/'tintuc'/g, "'tintuc'");
    content = content.replace(/FROM tintuc/g, 'FROM tintuc');
    content = content.replace(/INTO tintuc/g, 'INTO tintuc');
    content = content.replace(/UPDATE tintuc/g, 'UPDATE tintuc');
    if (file.includes('newsController') || file.includes('landingController') || file.includes('News') || file.includes('publicController')) {
        content = content.replace(/image_url/g, 'duong_dan_anh');
        content = content.replace(/drive_file_id/g, 'ma_file_drive');
        content = content.replace(/created_at/g, 'ngay_tao');
        content = content.replace(/content,/g, 'noi_dung,');
        content = content.replace(/content =/g, 'noi_dung =');
        content = content.replace(/\.content/g, '.noi_dung');
        content = content.replace(/title/g, 'tieu_de');
        // id -> ma_tin_tuc in query
        if (file.includes('newsController')) {
             content = content.replace(/SET tieu_de/g, 'SET tieu_de');
        }
    }

    // 5. QUYTRINH_DANG (quytrinhdang)
    content = content.replace(/quytrinhdang/g, 'quytrinhdang');
    if (file.includes('document')) {
        content = content.replace(/file_url/g, 'duong_dan_file');
    }

    // 6. SODO_TOCHUC (sodotochuc)
    content = content.replace(/sodotochuc/g, 'sodotochuc');
    content = content.replace(/ma_so_do_cha/g, 'ma_so_do_cha');

    // 7. THONG_BAO (thongbao)
    content = content.replace(/thongbao/g, 'thongbao');
    content = content.replace(/ma_nguoi_nhan/g, 'ma_nguoi_nhan');
    content = content.replace(/quyen_nguoi_nhan/g, 'quyen_nguoi_nhan');
    content = content.replace(/da_doc/g, 'da_doc');
    content = content.replace(/da_xoa/g, 'da_xoa');
    if (file.includes('notification')) {
        content = content.replace(/type\b/g, 'loai_thongbao');
        content = content.replace(/title/g, 'tieu_de');
        content = content.replace(/\.content/g, '.noi_dung');
        content = content.replace(/created_at/g, 'ngay_tao');
        content = content.replace(/id \b/g, 'ma_thongbao ');
    }

    // 8. FORMS (bieumau)
    content = content.replace(/"bieumau"/g, '"bieumau"');
    content = content.replace(/'bieumau'/g, "'bieumau'");
    content = content.replace(/FROM bieumau/g, 'FROM bieumau');
    content = content.replace(/INTO bieumau/g, 'INTO bieumau');
    content = content.replace(/UPDATE bieumau/g, 'UPDATE bieumau');
    if (file.includes('branchForm') || file.includes('bieumau') || file.includes('Form')) {
        content = content.replace(/file_url/g, 'duong_dan_file');
        content = content.replace(/uploaded_by/g, 'nguoi_tai_len');
        content = content.replace(/title/g, 'tieu_de');
        content = content.replace(/drive_file_id/g, 'ma_file_drive');
        content = content.replace(/created_at/g, 'ngay_tao');
        // id -> ma_bieu_mau (Be careful)
    }

    // Save if changed
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
console.log('REFACTOR DONE');
