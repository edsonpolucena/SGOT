/**
 * Formata valores monetários
 * @param {number|string} value
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrency(value, currency = 'BRL') {
  if (value === null || value === undefined || value === '' || isNaN(value)) {
    return '-';
  }
  const num = Number(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Formata números com casas decimais
 * @param {number|string} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === '' || isNaN(value)) {
    return '-';
  }
  const num = Number(value);
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata CNPJ
 * @param {string} value
 * @returns {string}
 */
export function formatCNPJ(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) return value;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF
 * @param {string} value
 * @returns {string}
 */
export function formatCPF(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return value;
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Formata telefone (10 ou 11 dígitos)
 * @param {string} value
 * @returns {string}
 */
export function formatPhone(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return value;
}

/**
 * Formata CEP
 * @param {string} value
 * @returns {string}
 */
export function formatCEP(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return value;
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Trunca texto
 * @param {string} text
 * @param {number} limit
 * @returns {string}
 */
export function truncateText(text, limit = 50) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= limit) return text;
  return text.slice(0, limit) + '...';
}

/**
 * Capitaliza cada palavra
 * @param {string} text
 * @returns {string}
 */
export function capitalizeWords(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Remove acentos
 * @param {string} text
 * @returns {string}
 */
export function removeAccents(text) {
  if (!text || typeof text !== 'string') return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Converte string para slug (URL-friendly)
 * @param {string} text
 * @returns {string}
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






