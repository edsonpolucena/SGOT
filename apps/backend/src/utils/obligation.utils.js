const { ObligationStatus } = require('@prisma/client');

/**
 * Computa o status de uma obrigação baseado na data de vencimento
 * @param {string|Date} dueDate - Data de vencimento (não usado mais - mantido por compatibilidade)
 * @param {string|Date} current - Data atual (não usado mais - mantido por compatibilidade)
 * @param {string} original - Status original (opcional)
 * @returns {string} Status da obrigação
 */
function computeStatus(dueDate, current = new Date(), original) {
  // Se já tem status definido (ex: NOT_APPLICABLE), preserva
  if (original === 'NOT_APPLICABLE') return original;
  
  // Sempre retorna PENDING (status padrão)
  return ObligationStatus.PENDING;
}

/**
 * Formata valor monetário para exibição
 * @param {number|string} amount - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: 'BRL')
 * @returns {string} Valor formatado
 */
function formatCurrency(amount, currency = 'BRL') {
  if (amount === null || amount === undefined || amount === '') return '-';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '-';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(numAmount);
}

/**
 * Formata data para exibição brasileira
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada (DD/MM/AAAA)
 */
function formatDate(date) {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '-';
  
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para exibição brasileira
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data e hora formatada (DD/MM/AAAA HH:MM)
 */
function formatDateTime(date) {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '-';
  
  return dateObj.toLocaleString('pt-BR');
}

/**
 * Valida se uma data é válida
 * @param {string|Date} date - Data a ser validada
 * @returns {boolean} True se a data é válida
 */
function isValidDate(date) {
  if (!date) return false;
  
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * Calcula dias até o vencimento
 * @param {string|Date} dueDate - Data de vencimento
 * @param {string|Date} current - Data atual (opcional)
 * @returns {number} Número de dias até o vencimento (negativo se vencido)
 */
function daysUntilDue(dueDate, current = new Date()) {
  if (!isValidDate(dueDate) || !isValidDate(current)) return null;
  
  const due = new Date(dueDate);
  const now = new Date(current);
  
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gera código único para empresa
 * @param {string} prefix - Prefixo do código (opcional)
 * @param {number} length - Tamanho do código (padrão: 6)
 * @returns {string} Código único
 */
function generateCompanyCode(prefix = '', length = 6) {
  const timestamp = Date.now().toString();
  const randomLength = Math.max(1, length - prefix.length - 3);
  const random = Math.random().toString(36).substring(2, 2 + randomLength);
  return prefix + timestamp.slice(-3) + random.toUpperCase();
}

/**
 * Valida CNPJ
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} True se o CNPJ é válido
 */
function validateCNPJ(cnpj) {
  if (!cnpj) return false;
  
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let weight = 2;
  
  // Primeiro dígito verificador
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleanCNPJ[12]) !== firstDigit) return false;
  
  // Segundo dígito verificador
  sum = 0;
  weight = 2;
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cleanCNPJ[13]) === secondDigit;
}

/**
 * Formata CNPJ para exibição
 * @param {string} cnpj - CNPJ a ser formatado
 * @returns {string} CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return cnpj;
  
  return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Sanitiza string removendo caracteres especiais
 * @param {string} str - String a ser sanitizada
 * @returns {string} String sanitizada
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limita tamanho
}

/**
 * Converte string para slug (URL-friendly)
 * @param {string} str - String a ser convertida
 * @returns {string} Slug
 */
function toSlug(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/[\s_-]+/g, '-') // Substitui espaços e underscores por hífens
    .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
}

module.exports = {
  computeStatus,
  formatCurrency,
  formatDate,
  formatDateTime,
  isValidDate,
  daysUntilDue,
  generateCompanyCode,
  validateCNPJ,
  formatCNPJ,
  sanitizeString,
  toSlug
};
