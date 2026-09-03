import React, { useEffect, useRef } from 'react';
import './RichTextEditor.css';

const ALLOWED = new Set(['B','STRONG','I','EM','U','S','P','DIV','BR','UL','OL','LI','H2','H3','BLOCKQUOTE','A']);
export const sanitizeRichText = (html = '') => {
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  [...doc.body.querySelectorAll('*')].forEach(el => {
    if (!ALLOWED.has(el.tagName) && el.parentNode) { el.replaceWith(...el.childNodes); return; }
    [...el.attributes].forEach(attr => {
      if (el.tagName === 'A' && ['href','target','rel'].includes(attr.name)) return;
      if (attr.name === 'style' && /^(text-align:\s*(left|center|right|justify);?\s*)$/i.test(attr.value)) return;
      el.removeAttribute(attr.name);
    });
    if (el.tagName === 'A') { el.setAttribute('target','_blank'); el.setAttribute('rel','noopener noreferrer'); }
  });
  return doc.body.firstElementChild?.innerHTML || '';
};

const RichTextEditor = ({ value='', onChange, placeholder='Nhập nội dung...', minHeight=150, disabled=false }) => {
  const editorRef = useRef(null);
  useEffect(() => { if (editorRef.current && document.activeElement !== editorRef.current && editorRef.current.innerHTML !== (value||'')) editorRef.current.innerHTML = sanitizeRichText(value||''); }, [value]);
  const emit = () => onChange?.(sanitizeRichText(editorRef.current?.innerHTML || ''));
  const run = (command, argument) => { editorRef.current?.focus(); document.execCommand(command, false, argument); emit(); };
  const link = () => { const url=window.prompt('Nhập địa chỉ liên kết (https://...)'); if (url && /^https?:\/\//i.test(url)) run('createLink',url); };
  const tools=[['B','bold','Đậm'],['I','italic','Nghiêng'],['U','underline','Gạch chân'],['H2','formatBlock','Tiêu đề'],['•','insertUnorderedList','Danh sách dấu chấm'],['1.','insertOrderedList','Danh sách số'],['≡','justifyLeft','Căn trái'],['≣','justifyCenter','Căn giữa'],['☰','justifyRight','Căn phải']];
  return <div className={`rich-editor ${disabled?'is-disabled':''}`}>
    {!disabled&&<div className="rich-editor__toolbar" role="toolbar" aria-label="Định dạng nội dung">{tools.map(([label,cmd,title])=><button key={title} type="button" title={title} onMouseDown={e=>{e.preventDefault();run(cmd,cmd==='formatBlock'?'H2':undefined);}}>{label}</button>)}<button type="button" title="Chèn liên kết" onMouseDown={e=>{e.preventDefault();link();}}>🔗</button><button type="button" title="Xóa định dạng" onMouseDown={e=>{e.preventDefault();run('removeFormat');}}>Tx</button></div>}
    <div ref={editorRef} className="rich-editor__content" contentEditable={!disabled} suppressContentEditableWarning data-placeholder={placeholder} style={{minHeight}} onInput={emit} onBlur={emit}/>
  </div>;
};
export const RichTextContent=({html,className=''})=><div className={`rich-text-content ${className}`} dangerouslySetInnerHTML={{__html:sanitizeRichText(html||'')}}/>;
export default RichTextEditor;
