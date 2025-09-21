/**
 * Formata valor monetário para exibição
 * @param {number|string} amount - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: 'BRL')
 * @returns {string} Valor formatado
 */
export function formatCurrency(amount, currency = 'BRL') {
  if (amount === null || amount === undefined || amount === '') return '-';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '-';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(numAmount);
}

/**
 * Formata número para exibição
 * @param {number|string} number - Número a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} Número formatado
 */
export function formatNumber(number, decimals = 2) {
  if (number === null || number === undefined || number === '') return '-';
  
  const numNumber = typeof number === 'string' ? parseFloat(number) : number;
  if (isNaN(numNumber)) return '-';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numNumber);
}

/**
 * Formata CNPJ para exibição
 * @param {string} cnpj - CNPJ a ser formatado
 * @returns {string} CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return cnpj;
  
  return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF para exibição
 * @param {string} cpf - CPF a ser formatado
 * @returns {string} CPF formatado (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf) {
  if (!cpf) return '';
  
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return cpf;
  
  return cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Formata telefone para exibição
 * @param {string} phone - Telefone a ser formatado
 * @returns {string} Telefone formatado
 */
export function formatPhone(phone) {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Formata CEP para exibição
 * @param {string} cep - CEP a ser formatado
 * @returns {string} CEP formatado (XXXXX-XXX)
 */
export function formatCEP(cep) {
  if (!cep) return '';
  
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) return cep;
  
  return cleanCEP.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Trunca texto com reticências
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo (padrão: 50)
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 50) {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza primeira letra de cada palavra
 * @param {string} text - Texto a ser capitalizado
 * @returns {string} Texto capitalizado
 */
export function capitalizeWords(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Remove acentos de uma string
 * @param {string} text - Texto a ser processado
 * @returns {string} Texto sem acentos
 */
export function removeAccents(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Converte string para slug (URL-friendly)
 * @param {string} text - String a ser convertida
 * @returns {string} Slug
 */
export function toSlug(text) {
  if (!text || typeof text !== 'string') return '';
  
  return removeAccents(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
