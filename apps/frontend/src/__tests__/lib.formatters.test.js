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
  toSlug
} from '../shared/lib/formatters';

describe('Formatters Utils - Unit Tests', () => {
  
  describe('formatCurrency', () => {
    it('deve formatar valor numérico corretamente', () => {
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/R\$\s*1\.234,56/);
    });

    it('deve formatar string numérica', () => {
      const result = formatCurrency('1234.56');
      expect(result).toMatch(/R\$\s*1\.234,56/);
    });

    it('deve retornar "-" para valores nulos', () => {
      expect(formatCurrency(null)).toBe('-');
      expect(formatCurrency(undefined)).toBe('-');
      expect(formatCurrency('')).toBe('-');
    });

    it('deve retornar "-" para valores inválidos', () => {
      expect(formatCurrency('abc')).toBe('-');
      expect(formatCurrency(NaN)).toBe('-');
    });

    it('deve formatar zero corretamente', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/R\$\s*0,00/);
    });

    it('deve aceitar moeda customizada', () => {
      const result = formatCurrency(100, 'USD');
      expect(result).toMatch(/US\$\s*100,00/);
    });
  });

  describe('formatNumber', () => {
    it('deve formatar número com casas decimais padrão', () => {
      const result = formatNumber(1234.567);
      expect(result).toBe('1.234,57');
    });

    it('deve formatar número com casas decimais customizadas', () => {
      const result = formatNumber(1234.567, 1);
      expect(result).toBe('1.234,6');
    });

    it('deve formatar número inteiro', () => {
      const result = formatNumber(1234, 0);
      expect(result).toBe('1.234');
    });

    it('deve retornar "-" para valores inválidos', () => {
      expect(formatNumber('abc')).toBe('-');
      expect(formatNumber(null)).toBe('-');
    });
  });

  describe('formatCNPJ', () => {
    it('deve formatar CNPJ corretamente', () => {
      const result = formatCNPJ('11222333000181');
      expect(result).toBe('11.222.333/0001-81');
    });

    it('deve retornar string original se inválida', () => {
      const result = formatCNPJ('123');
      expect(result).toBe('123');
    });

    it('deve retornar string vazia para valores nulos', () => {
      expect(formatCNPJ(null)).toBe('');
      expect(formatCNPJ(undefined)).toBe('');
    });

    it('deve formatar CNPJ com caracteres especiais', () => {
      const result = formatCNPJ('11.222.333/0001-81');
      expect(result).toBe('11.222.333/0001-81');
    });
  });

  describe('formatCPF', () => {
    it('deve formatar CPF corretamente', () => {
      const result = formatCPF('12345678901');
      expect(result).toBe('123.456.789-01');
    });

    it('deve retornar string original se inválida', () => {
      const result = formatCPF('123');
      expect(result).toBe('123');
    });

    it('deve retornar string vazia para valores nulos', () => {
      expect(formatCPF(null)).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('deve formatar telefone com 11 dígitos', () => {
      const result = formatPhone('11987654321');
      expect(result).toBe('(11) 98765-4321');
    });

    it('deve formatar telefone com 10 dígitos', () => {
      const result = formatPhone('1133334444');
      expect(result).toBe('(11) 3333-4444');
    });

    it('deve retornar string original se inválida', () => {
      const result = formatPhone('123');
      expect(result).toBe('123');
    });

    it('deve retornar string vazia para valores nulos', () => {
      expect(formatPhone(null)).toBe('');
    });

    it('deve formatar telefone com caracteres especiais', () => {
      const result = formatPhone('(11) 98765-4321');
      expect(result).toBe('(11) 98765-4321');
    });
  });

  describe('formatCEP', () => {
    it('deve formatar CEP corretamente', () => {
      const result = formatCEP('01234567');
      expect(result).toBe('01234-567');
    });

    it('deve retornar string original se inválida', () => {
      const result = formatCEP('123');
      expect(result).toBe('123');
    });

    it('deve retornar string vazia para valores nulos', () => {
      expect(formatCEP(null)).toBe('');
    });
  });

  describe('truncateText', () => {
    it('deve truncar texto longo', () => {
      const longText = 'Este é um texto muito longo que deve ser truncado';
      const result = truncateText(longText, 20);
      expect(result).toMatch(/Este é um texto mui.*\.\.\./);
    });

    it('deve retornar texto original se menor que limite', () => {
      const shortText = 'Texto curto';
      const result = truncateText(shortText, 20);
      expect(result).toBe('Texto curto');
    });

    it('deve usar limite padrão', () => {
      const longText = 'a'.repeat(60);
      const result = truncateText(longText);
      expect(result).toBe('a'.repeat(50) + '...');
    });

    it('deve retornar string vazia para valores inválidos', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(123)).toBe('');
    });
  });

  describe('capitalizeWords', () => {
    it('deve capitalizar primeira letra de cada palavra', () => {
      const result = capitalizeWords('joão da silva');
      expect(result).toBe('João Da Silva');
    });

    it('deve lidar com texto em maiúsculas', () => {
      const result = capitalizeWords('JOAO DA SILVA');
      expect(result).toBe('Joao Da Silva');
    });

    it('deve retornar string vazia para valores inválidos', () => {
      expect(capitalizeWords(null)).toBe('');
      expect(capitalizeWords(123)).toBe('');
    });

    it('deve lidar com texto vazio', () => {
      expect(capitalizeWords('')).toBe('');
    });
  });

  describe('removeAccents', () => {
    it('deve remover acentos corretamente', () => {
      const result = removeAccents('café');
      expect(result).toBe('cafe');
    });

    it('deve remover múltiplos acentos', () => {
      const result = removeAccents('João José da Silva');
      expect(result).toBe('Joao Jose da Silva');
    });

    it('deve retornar string vazia para valores inválidos', () => {
      expect(removeAccents(null)).toBe('');
      expect(removeAccents(123)).toBe('');
    });

    it('deve preservar texto sem acentos', () => {
      const result = removeAccents('texto sem acentos');
      expect(result).toBe('texto sem acentos');
    });
  });

  describe('toSlug', () => {
    it('deve converter string para slug', () => {
      const result = toSlug('Minha Empresa Ltda');
      expect(result).toBe('minha-empresa-ltda');
    });

    it('deve remover acentos', () => {
      const result = toSlug('Empresa Ação');
      expect(result).toBe('empresa-acao');
    });

    it('deve remover caracteres especiais', () => {
      const result = toSlug('Empresa@#$%^&*()');
      expect(result).toBe('empresa');
    });

    it('deve substituir espaços por hífens', () => {
      const result = toSlug('empresa com espaços');
      expect(result).toBe('empresa-com-espacos');
    });

    it('deve remover hífens do início e fim', () => {
      const result = toSlug('-empresa-');
      expect(result).toBe('empresa');
    });

    it('deve retornar string vazia para valores inválidos', () => {
      expect(toSlug(null)).toBe('');
      expect(toSlug(123)).toBe('');
    });

    it('deve converter para minúsculas', () => {
      const result = toSlug('EMPRESA');
      expect(result).toBe('empresa');
    });
  });
});
