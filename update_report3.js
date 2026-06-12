const fs = require("fs");
let text = fs.readFileSync("Bao_cao_NCKH.txt", "utf8");

text = text.replace(/\nh\v*2\.7\.(?=\s|\d)/g, "\n2.8.");
text = text.replace(/\nh\v*2\.6\.(?=\s|\d)/g, "\n2.7.");
text = text.replace(/\nh\v*2\.5\.(?=\s|\d)/g, "\n2.6.");

const newSectionContent = `2.5. HỆ THỐNG BÀN ĐẢNG “NGHiỆP VỤ VÀ LEỰA CHOỌN KIẾN TRÚC��^�g���r�'��h����e��+y�^m��hq�e