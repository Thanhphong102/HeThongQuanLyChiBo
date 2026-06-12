import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_text(path):
    try:
        docx = zipfile.ZipFile(path)
        content = docx.read('word/document.xml')
        tree = ET.fromstring(content)
        
        # Word namespaces
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = []
        for paragraph in tree.findall('.//w:p', ns):
            texts = [node.text for node in paragraph.findall('.//w:t', ns) if node.text]
            if texts:
                paragraphs.append(''.join(texts))
        
        return '\n'.join(paragraphs)
    except Exception as e:
        return str(e)

files_to_read = [
    r"d:\NCKHSV\Bao_cao_NCKH.docx",
    r"d:\NCKHSV\SV04_Quy định hinh thuc trinh bay bao cao tong ket de tai NCKH SV.docx"
]

for file in files_to_read:
    if os.path.exists(file):
        text = extract_text(file)
        txt_path = file.replace('.docx', '.txt')
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Extracted: {txt_path}")
    else:
        print(f"Not found: {file}")
