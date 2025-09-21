import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  isValidDate,
  daysUntilDue,
  isOverdue,
  addDays,
  daysDifference
} from '../shared/lib/dates';

describe('Dates Utils - Unit Tests', () => {
  
  describe('formatDate', () => {
    it('deve formatar data corretamente', () => {
      const result = formatDate('2025-01-15');
      expect(result).toMatch(/1[45]\/01\/2025/);
    });

    it('deve formatar objeto Date', () => {
      const date = new Date('2025-01-15');
      const result = formatDate(date);
      expect(result).toMatch(/1[45]\/01\/2025/);
    });

    it('deve retornar "-" para datas inválidas', () => {
      expect(formatDate('invalid-date')).toBe('-');
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
    });
  });

  describe('formatDateTime', () => {
    it('deve formatar data e hora corretamente', () => {
      const result = formatDateTime('2025-01-15T14:30:00');
      expect(result).toMatch(/1[45]\/01\/2025.*14:30/);
    });

    it('deve retornar "-" para datas inválidas', () => {
      expect(formatDateTime('invalid-date')).toBe('-');
      expect(formatDateTime(null)).toBe('-');
    });
  });

  describe('isValidDate', () => {
    it('deve retornar true para datas válidas', () => {
      expect(isValidDate('2025-01-15')).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate('2025-01-15T14:30:00')).toBe(true);
    });

    it('deve retornar false para datas inválidas', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('daysUntilDue', () => {
    it('deve calcular dias corretamente para data futura', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const result = daysUntilDue(futureDate);
      expect(result).toBe(10);
    });

    it('deve retornar valor negativo para data passada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const result = daysUntilDue(pastDate);
      expect(result).toBe(-5);
    });

    it('deve retornar null para datas inválidas', () => {
      expect(daysUntilDue('invalid-date')).toBe(null);
      expect(daysUntilDue(null)).toBe(null);
    });

    it('deve aceitar data atual customizada', () => {
      const dueDate = '2025-01-15';
      const currentDate = '2025-01-10';
      
      const result = daysUntilDue(dueDate, currentDate);
      expect(result).toBe(5);
    });
  });

  describe('isOverdue', () => {
    it('deve retornar true para data vencida', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const result = isOverdue(pastDate);
      expect(result).toBe(true);
    });

    it('deve retornar false para data futura', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const result = isOverdue(futureDate);
      expect(result).toBe(false);
    });

    it('deve retornar false para data de hoje', () => {
      const today = new Date();
      const result = isOverdue(today);
      expect(result).toBe(false);
    });
  });

  describe('addDays', () => {
    it('deve adicionar dias corretamente', () => {
      const date = new Date('2025-01-15');
      const result = addDays(date, 10);
      
      expect(result.getDate()).toBeGreaterThan(20);
      expect(result.getMonth()).toBe(0); // Janeiro
      expect(result.getFullYear()).toBe(2025);
    });

    it('deve subtrair dias com valor negativo', () => {
      const date = new Date('2025-01-15');
      const result = addDays(date, -5);
      
      expect(result.getDate()).toBeLessThan(15);
    });

    it('deve aceitar string de data', () => {
      const result = addDays('2025-01-15', 7);
      expect(result.getDate()).toBeGreaterThan(15);
    });
  });

  describe('daysDifference', () => {
    it('deve calcular diferença corretamente', () => {
      const date1 = '2025-01-10';
      const date2 = '2025-01-15';
      
      const result = daysDifference(date1, date2);
      expect(result).toBe(5);
    });

    it('deve retornar valor absoluto', () => {
      const date1 = '2025-01-15';
      const date2 = '2025-01-10';
      
      const result = daysDifference(date1, date2);
      expect(result).toBe(5);
    });

    it('deve retornar null para datas inválidas', () => {
      expect(daysDifference('invalid-date', '2025-01-15')).toBe(null);
      expect(daysDifference('2025-01-15', null)).toBe(null);
    });

    it('deve retornar 0 para datas iguais', () => {
      const result = daysDifference('2025-01-15', '2025-01-15');
      expect(result).toBe(0);
    });
  });
});
