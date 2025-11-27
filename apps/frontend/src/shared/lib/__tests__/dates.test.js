import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDate,
  formatDateTime,
  isValidDate,
  daysUntilDue,
  isOverdue,
  addDays,
  daysDifference,
} from '../dates';

describe('dates.js - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatDate', () => {
    it('deve formatar data válida para formato brasileiro', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('deve formatar string de data válida', () => {
      expect(formatDate('2025-01-15')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('deve retornar "-" quando date é null', () => {
      expect(formatDate(null)).toBe('-');
    });

    it('deve retornar "-" quando date é undefined', () => {
      expect(formatDate(undefined)).toBe('-');
    });

    it('deve retornar "-" quando date é string inválida', () => {
      expect(formatDate('invalid-date')).toBe('-');
    });

    it('deve retornar "-" quando date é vazia', () => {
      expect(formatDate('')).toBe('-');
    });
  });

  describe('formatDateTime', () => {
    it('deve formatar data e hora válida', () => {
      const date = new Date('2025-01-15T10:30:00');
      const result = formatDateTime(date);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('deve formatar string de data e hora válida', () => {
      const result = formatDateTime('2025-01-15T10:30:00');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('deve retornar "-" quando date é null', () => {
      expect(formatDateTime(null)).toBe('-');
    });

    it('deve retornar "-" quando date é undefined', () => {
      expect(formatDateTime(undefined)).toBe('-');
    });

    it('deve retornar "-" quando date é inválida', () => {
      expect(formatDateTime('invalid')).toBe('-');
    });
  });

  describe('isValidDate', () => {
    it('deve retornar true para data válida', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate('2025-01-15')).toBe(true);
    });

    it('deve retornar false para null', () => {
      expect(isValidDate(null)).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(isValidDate(undefined)).toBe(false);
    });

    it('deve retornar false para string inválida', () => {
      expect(isValidDate('invalid-date')).toBe(false);
    });

    it('deve retornar false para string vazia', () => {
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('daysUntilDue', () => {
    it('deve calcular dias até vencimento corretamente (futuro)', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);
      const result = daysUntilDue(dueDate);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('deve calcular dias até vencimento corretamente (passado)', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5);
      const result = daysUntilDue(dueDate);
      expect(result).toBeLessThan(0);
    });

    it('deve calcular dias até vencimento com data atual customizada', () => {
      const dueDate = new Date('2025-01-20');
      const current = new Date('2025-01-15');
      const result = daysUntilDue(dueDate, current);
      expect(result).toBe(5);
    });

    it('deve retornar null quando dueDate é inválida', () => {
      expect(daysUntilDue('invalid')).toBe(null);
    });

    it('deve retornar null quando current é inválida', () => {
      const dueDate = new Date();
      expect(daysUntilDue(dueDate, 'invalid')).toBe(null);
    });

    it('deve retornar null quando ambos são inválidos', () => {
      expect(daysUntilDue('invalid', 'invalid')).toBe(null);
    });

    it('deve calcular corretamente quando vencimento é hoje', () => {
      const today = new Date();
      const result = daysUntilDue(today, today);
      expect(result).toBe(0);
    });
  });

  describe('isOverdue', () => {
    it('deve retornar true quando data está vencida', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 1);
      expect(isOverdue(dueDate)).toBe(true);
    });

    it('deve retornar false quando data não está vencida', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      expect(isOverdue(dueDate)).toBe(false);
    });

    it('deve retornar false quando data é hoje', () => {
      const today = new Date();
      expect(isOverdue(today, today)).toBe(false);
    });

    it('deve usar data atual customizada', () => {
      const dueDate = new Date('2025-01-10');
      const current = new Date('2025-01-15');
      expect(isOverdue(dueDate, current)).toBe(true);
    });
  });

  describe('addDays', () => {
    it('deve adicionar dias positivos', () => {
      const date = new Date('2025-01-15');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('deve adicionar dias negativos (subtrair)', () => {
      const date = new Date('2025-01-15');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it('deve funcionar com string de data', () => {
      const result = addDays('2025-01-15', 10);
      expect(result.getDate()).toBe(25);
    });

    it('deve lidar com mudança de mês', () => {
      const date = new Date('2025-01-28');
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1); // Fevereiro
    });

    it('deve lidar com mudança de ano', () => {
      const date = new Date('2025-12-28');
      const result = addDays(date, 5);
      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe('daysDifference', () => {
    it('deve calcular diferença em dias corretamente', () => {
      const date1 = new Date('2025-01-10');
      const date2 = new Date('2025-01-15');
      expect(daysDifference(date1, date2)).toBe(5);
    });

    it('deve retornar valor absoluto (sempre positivo)', () => {
      const date1 = new Date('2025-01-15');
      const date2 = new Date('2025-01-10');
      expect(daysDifference(date1, date2)).toBe(5);
    });

    it('deve retornar null quando date1 é inválida', () => {
      expect(daysDifference('invalid', new Date())).toBe(null);
    });

    it('deve retornar null quando date2 é inválida', () => {
      expect(daysDifference(new Date(), 'invalid')).toBe(null);
    });

    it('deve retornar null quando ambas são inválidas', () => {
      expect(daysDifference('invalid', 'invalid')).toBe(null);
    });

    it('deve retornar 0 quando datas são iguais', () => {
      const date = new Date('2025-01-15');
      expect(daysDifference(date, date)).toBe(0);
    });

    it('deve funcionar com strings de data', () => {
      expect(daysDifference('2025-01-10', '2025-01-15')).toBe(5);
    });
  });
});
