const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const getMediaUrl = (url) => {
  if (!url) return '';

  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/);
    if (idMatch) return `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
  }

  if (url.startsWith('/uploads')) return `${API_ORIGIN}${url}`;

  return url;
};
