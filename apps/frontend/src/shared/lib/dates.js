/**
 * Formata data para exibição brasileira
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada (DD/MM/AAAA)
 */
export function formatDate(date) {
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
export function formatDateTime(date) {
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
export function isValidDate(date) {
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
export function daysUntilDue(dueDate, current = new Date()) {
  if (!isValidDate(dueDate) || !isValidDate(current)) return null;
  
  const due = new Date(dueDate);
  const now = new Date(current);
  
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma data está vencida
 * @param {string|Date} dueDate - Data de vencimento
 * @param {string|Date} current - Data atual (opcional)
 * @returns {boolean} True se a data está vencida
 */
export function isOverdue(dueDate, current = new Date()) {
  return daysUntilDue(dueDate, current) < 0;
}

/**
 * Adiciona dias a uma data
 * @param {string|Date} date - Data base
 * @param {number} days - Número de dias a adicionar
 * @returns {Date} Nova data
 */
export function addDays(date, days) {
  const dateObj = new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Calcula diferença em dias entre duas datas
 * @param {string|Date} date1 - Primeira data
 * @param {string|Date} date2 - Segunda data
 * @returns {number} Diferença em dias
 */
export function daysDifference(date1, date2) {
  if (!isValidDate(date1) || !isValidDate(date2)) return null;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

















