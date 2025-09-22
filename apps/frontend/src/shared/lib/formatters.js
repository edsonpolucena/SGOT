/**
 * Converte string para slug (URL-friendly)
 * @param {string} text - String a ser convertida
 * @returns {string} Slug
 */
export function toSlug(text) {
  if (!text || typeof text !== 'string') return '';

  let slug = removeAccents(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  
    .replace(/[\s_-]+/g, '-'); 

  
  if (slug.startsWith('-')) slug = slug.slice(1);
  if (slug.endsWith('-')) slug = slug.slice(0, -1);

  return slug;
}
