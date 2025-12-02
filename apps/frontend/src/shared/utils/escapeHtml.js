/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} str - String a ser escapada
 * @returns {string} String escapada
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Escapa texto mas preserva quebras de linha
 * @param {string} str - String a ser escapada
 * @returns {string} String escapada com quebras de linha preservadas
 */
export function escapeHtmlWithBreaks(str) {
  if (!str || typeof str !== 'string') return '';
  
  return escapeHtml(str)
    .replace(/\n/g, '<br />')
    .replace(/\r\n/g, '<br />');
}

