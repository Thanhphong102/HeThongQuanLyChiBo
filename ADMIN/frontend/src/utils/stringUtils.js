export const removeAccents = (str) => {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const fuzzySearch = (text, keyword) => {
  if (!text || !keyword) return false;
  return removeAccents(text).toLowerCase().includes(removeAccents(keyword).toLowerCase());
};
