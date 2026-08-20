export const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const editDistance = (left, right) => {
  const a = removeAccents(left);
  const b = removeAccents(right);
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const previous = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = previous;
    }
  }
  return row[b.length];
};

export const fuzzyMatch = (value, query) => {
  const target = removeAccents(value).trim();
  const keyword = removeAccents(query).trim();
  if (!keyword) return true;
  if (target.includes(keyword)) return true;

  const targetWords = target.split(/\s+/).filter(Boolean);
  return keyword.split(/\s+/).filter(Boolean).every(part =>
    targetWords.some(word => {
      if (word.includes(part) || part.includes(word)) return true;
      if (part.length < 3) return false;
      const tolerance = Math.max(1, Math.floor(part.length * 0.25));
      return editDistance(word, part) <= tolerance;
    })
  );
};
