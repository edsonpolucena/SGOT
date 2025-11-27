import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatCNPJ,
  formatCPF,
  formatPhone,
  formatCEP,
  truncateText,
  capitalizeWords,
  removeAccents,
  toSlug,
} from '../formatters';

describe('formatters.js - 100% Coverage', () => {
  describe('formatCurrency', () => {
    it('deve formatar valor monetário corretamente', () => {
      expect(formatCurrency(1234.56)).toContain('1.234,56');
      expect(formatCurrency(1234.56)).toContain('R$');
    });

    it('deve formatar zero', () => {
      expect(formatCurrency(0)).toContain('0,00');
    });

    it('deve formatar valores negativos', () => {
      expect(formatCurrency(-100)).toContain('-');
    });

    it('deve retornar "-" quando value é null', () => {
      expect(formatCurrency(null)).toBe('-');
    });

    it('deve retornar "-" quando value é undefined', () => {
      expect(formatCurrency(undefined)).toBe('-');
    });

    it('deve retornar "-" quando value é string vazia', () => {
      expect(formatCurrency('')).toBe('-');
    });

    it('deve retornar "-" quando value é NaN', () => {
      expect(formatCurrency(NaN)).toBe('-');
    });

    it('deve retornar "-" quando value é string inválida', () => {
      expect(formatCurrency('abc')).toBe('-');
    });

    it('deve aceitar string numérica', () => {
      expect(formatCurrency('1234.56')).toContain('1.234,56');
    });

    it('deve aceitar currency customizada', () => {
      const result = formatCurrency(100, 'USD');
      expect(result).toContain('100');
    });
  });

  describe('formatNumber', () => {
    it('deve formatar número com decimais padrão', () => {
      expect(formatNumber(1234.56)).toBe('1.234,56');
    });

    it('deve formatar número com decimais customizados', () => {
      expect(formatNumber(1234.5, 3)).toBe('1.234,500');
    });

    it('deve formatar número inteiro', () => {
      expect(formatNumber(1234, 0)).toBe('1.234');
    });

    it('deve retornar "-" quando value é null', () => {
      expect(formatNumber(null)).toBe('-');
    });

    it('deve retornar "-" quando value é undefined', () => {
      expect(formatNumber(undefined)).toBe('-');
    });

    it('deve retornar "-" quando value é string vazia', () => {
      expect(formatNumber('')).toBe('-');
    });

    it('deve retornar "-" quando value é NaN', () => {
      expect(formatNumber(NaN)).toBe('-');
    });

    it('deve aceitar string numérica', () => {
      expect(formatNumber('1234.56')).toBe('1.234,56');
    });
  });

  describe('formatCNPJ', () => {
    it('deve formatar CNPJ válido corretamente', () => {
      expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
    });

    it('deve retornar string vazia quando value é null', () => {
      expect(formatCNPJ(null)).toBe('');
    });

    it('deve retornar string vazia quando value é undefined', () => {
      expect(formatCNPJ(undefined)).toBe('');
    });

    it('deve retornar string vazia quando value é vazio', () => {
      expect(formatCNPJ('')).toBe('');
    });

    it('deve retornar value original quando não tem 14 dígitos', () => {
      expect(formatCNPJ('123')).toBe('123');
    });

    it('deve remover caracteres não numéricos antes de formatar', () => {
      expect(formatCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
    });

    it('deve retornar value original quando tem mais de 14 dígitos', () => {
      expect(formatCNPJ('123456780001901')).toBe('123456780001901');
    });
  });

  describe('formatCPF', () => {
    it('deve formatar CPF válido corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
    });

    it('deve retornar string vazia quando value é null', () => {
      expect(formatCPF(null)).toBe('');
    });

    it('deve retornar string vazia quando value é undefined', () => {
      expect(formatCPF(undefined)).toBe('');
    });

    it('deve retornar string vazia quando value é vazio', () => {
      expect(formatCPF('')).toBe('');
    });

    it('deve retornar value original quando não tem 11 dígitos', () => {
      expect(formatCPF('123')).toBe('123');
    });

    it('deve remover caracteres não numéricos antes de formatar', () => {
      expect(formatCPF('123.456.789-01')).toBe('123.456.789-01');
    });
  });

  describe('formatPhone', () => {
    it('deve formatar telefone de 10 dígitos', () => {
      expect(formatPhone('4799999999')).toBe('(47) 9999-9999');
    });

    it('deve formatar telefone de 11 dígitos', () => {
      expect(formatPhone('47999999999')).toBe('(47) 99999-9999');
    });

    it('deve retornar string vazia quando value é null', () => {
      expect(formatPhone(null)).toBe('');
    });

    it('deve retornar string vazia quando value é undefined', () => {
      expect(formatPhone(undefined)).toBe('');
    });

    it('deve retornar string vazia quando value é vazio', () => {
      expect(formatPhone('')).toBe('');
    });

    it('deve retornar value original quando não tem 10 ou 11 dígitos', () => {
      expect(formatPhone('123')).toBe('123');
    });

    it('deve remover caracteres não numéricos antes de formatar', () => {
      expect(formatPhone('(47) 9999-9999')).toBe('(47) 9999-9999');
    });
  });

  describe('formatCEP', () => {
    it('deve formatar CEP válido corretamente', () => {
      expect(formatCEP('89010000')).toBe('89010-000');
    });

    it('deve retornar string vazia quando value é null', () => {
      expect(formatCEP(null)).toBe('');
    });

    it('deve retornar string vazia quando value é undefined', () => {
      expect(formatCEP(undefined)).toBe('');
    });

    it('deve retornar string vazia quando value é vazio', () => {
      expect(formatCEP('')).toBe('');
    });

    it('deve retornar value original quando não tem 8 dígitos', () => {
      expect(formatCEP('123')).toBe('123');
    });

    it('deve remover caracteres não numéricos antes de formatar', () => {
      expect(formatCEP('89010-000')).toBe('89010-000');
    });
  });

  describe('truncateText', () => {
    it('deve truncar texto maior que o limite', () => {
      const text = 'a'.repeat(100);
      expect(truncateText(text, 50)).toBe('a'.repeat(50) + '...');
    });

    it('deve retornar texto completo quando menor que o limite', () => {
      expect(truncateText('short text', 50)).toBe('short text');
    });

    it('deve retornar texto exato quando igual ao limite', () => {
      const text = 'a'.repeat(50);
      expect(truncateText(text, 50)).toBe(text);
    });

    it('deve retornar string vazia quando text é null', () => {
      expect(truncateText(null)).toBe('');
    });

    it('deve retornar string vazia quando text é undefined', () => {
      expect(truncateText(undefined)).toBe('');
    });

    it('deve retornar string vazia quando text não é string', () => {
      expect(truncateText(123)).toBe('');
    });

    it('deve usar limite padrão de 50', () => {
      const text = 'a'.repeat(60);
      expect(truncateText(text)).toBe('a'.repeat(50) + '...');
    });
  });

  describe('capitalizeWords', () => {
    it('deve capitalizar cada palavra', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
    });

    it('deve capitalizar palavra única', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
    });

    it('deve retornar string vazia quando text é null', () => {
      expect(capitalizeWords(null)).toBe('');
    });

    it('deve retornar string vazia quando text é undefined', () => {
      expect(capitalizeWords(undefined)).toBe('');
    });

    it('deve retornar string vazia quando text não é string', () => {
      expect(capitalizeWords(123)).toBe('');
    });

    it('deve lidar com múltiplos espaços', () => {
      expect(capitalizeWords('hello   world')).toBe('Hello   World');
    });

    it('deve manter primeira letra minúscula se já estiver capitalizada', () => {
      expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
    });
  });

  describe('removeAccents', () => {
    it('deve remover acentos de texto', () => {
      expect(removeAccents('café')).toBe('cafe');
      expect(removeAccents('ação')).toBe('acao');
    });

    it('deve retornar string vazia quando text é null', () => {
      expect(removeAccents(null)).toBe('');
    });

    it('deve retornar string vazia quando text é undefined', () => {
      expect(removeAccents(undefined)).toBe('');
    });

    it('deve retornar string vazia quando text não é string', () => {
      expect(removeAccents(123)).toBe('');
    });

    it('deve manter texto sem acentos inalterado', () => {
      expect(removeAccents('hello')).toBe('hello');
    });
  });

  describe('toSlug', () => {
    it('deve converter texto para slug', () => {
      expect(toSlug('Hello World')).toBe('hello-world');
    });

    it('deve remover acentos', () => {
      expect(toSlug('café')).toBe('cafe');
    });

    it('deve remover caracteres especiais', () => {
      expect(toSlug('hello@world#123')).toBe('helloworld123');
    });

    it('deve substituir múltiplos espaços por um hífen', () => {
      expect(toSlug('hello   world')).toBe('hello-world');
    });

    it('deve remover hífen no início', () => {
      expect(toSlug('-hello')).toBe('hello');
    });

    it('deve remover hífen no final', () => {
      expect(toSlug('hello-')).toBe('hello');
    });

    it('deve retornar string vazia quando text é null', () => {
      expect(toSlug(null)).toBe('');
    });

    it('deve retornar string vazia quando text é undefined', () => {
      expect(toSlug(undefined)).toBe('');
    });

    it('deve retornar string vazia quando text não é string', () => {
      expect(toSlug(123)).toBe('');
    });

    it('deve converter para minúsculas', () => {
      expect(toSlug('HELLO WORLD')).toBe('hello-world');
    });

    it('deve remover espaços no início e fim', () => {
      expect(toSlug('  hello world  ')).toBe('hello-world');
    });
  });
});
