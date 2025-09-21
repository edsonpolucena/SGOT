const {
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
} = require('../utils/obligation.utils');

describe('Obligation Utils - Unit Tests', () => {
  
  describe('computeStatus', () => {
    it('deve retornar PENDING para data futura', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const result = computeStatus(futureDate);
      expect(result).toBe('PENDING');
    });

    it('deve retornar LATE para data passada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      
      const result = computeStatus(pastDate);
      expect(result).toBe('LATE');
    });

    it('deve retornar status original se for PAID', () => {
      const result = computeStatus('2025-01-01', new Date(), 'PAID');
      expect(result).toBe('PAID');
    });

    it('deve retornar status original se for CANCELED', () => {
      const result = computeStatus('2025-01-01', new Date(), 'CANCELED');
      expect(result).toBe('CANCELED');
    });

    it('deve aceitar string de data', () => {
      const result = computeStatus('2020-01-01');
      expect(result).toBe('LATE');
    });

    it('deve aceitar data atual customizada', () => {
      const dueDate = '2025-01-01';
      const currentDate = '2024-12-01';
      
      const result = computeStatus(dueDate, currentDate);
      expect(result).toBe('PENDING');
    });
  });

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
      expect(result).toMatch(/15\/01\/2025.*14:30/);
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

  describe('generateCompanyCode', () => {
    it('deve gerar código com prefixo', () => {
      const result = generateCompanyCode('EMP');
      expect(result).toMatch(/^EMP/);
      expect(result.length).toBeGreaterThan(3);
    });

    it('deve gerar código sem prefixo', () => {
      const result = generateCompanyCode();
      expect(result.length).toBeGreaterThan(5);
    });

    it('deve gerar códigos únicos', () => {
      const code1 = generateCompanyCode();
      const code2 = generateCompanyCode();
      expect(code1).not.toBe(code2);
    });

    it('deve aceitar tamanho customizado', () => {
      const result = generateCompanyCode('', 8);
      expect(result.length).toBeGreaterThan(7);
    });
  });

  describe('validateCNPJ', () => {
    it('deve validar CNPJ válido', () => {
      const validCNPJ = '11.222.333/0001-81';
      expect(validateCNPJ(validCNPJ)).toBe(true);
    });

    it('deve validar CNPJ sem formatação', () => {
      const validCNPJ = '11222333000181';
      expect(validateCNPJ(validCNPJ)).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      const invalidCNPJ = '11.222.333/0001-82';
      expect(validateCNPJ(invalidCNPJ)).toBe(false);
    });

    it('deve rejeitar CNPJ com todos os dígitos iguais', () => {
      const invalidCNPJ = '11111111111111';
      expect(validateCNPJ(invalidCNPJ)).toBe(false);
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      expect(validateCNPJ('123456789')).toBe(false);
      expect(validateCNPJ('123456789012345')).toBe(false);
    });

    it('deve rejeitar valores nulos ou vazios', () => {
      expect(validateCNPJ(null)).toBe(false);
      expect(validateCNPJ(undefined)).toBe(false);
      expect(validateCNPJ('')).toBe(false);
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
  });

  describe('sanitizeString', () => {
    it('deve remover caracteres perigosos', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('deve remover javascript:', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeString(input);
      expect(result).not.toContain('javascript:');
    });

    it('deve remover event handlers', () => {
      const input = 'onclick=alert("xss")';
      const result = sanitizeString(input);
      expect(result).not.toContain('onclick=');
    });

    it('deve limitar tamanho da string', () => {
      const longString = 'a'.repeat(2000);
      const result = sanitizeString(longString);
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('deve retornar string vazia para valores inválidos', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });

    it('deve preservar texto normal', () => {
      const input = 'Texto normal sem problemas';
      const result = sanitizeString(input);
      expect(result).toBe(input);
    });
  });

  describe('toSlug', () => {
    it('deve converter string para slug', () => {
      const result = toSlug('Minha Empresa Ltda');
      expect(result).toBe('minha-empresa-ltda');
    });

    it('deve remover caracteres especiais', () => {
      const result = toSlug('Empresa@#$%^&*()');
      expect(result).toBe('empresa');
    });

    it('deve substituir espaços por hífens', () => {
      const result = toSlug('empresa com espacos');
      expect(result).toBe('empresa-com-espacos');
    });

    it('deve remover hífens do início e fim', () => {
      const result = toSlug('-empresa-');
      expect(result).toBe('empresa');
    });

    it('deve retornar string vazia para valores inválidos', () => {
      expect(toSlug(null)).toBe('');
      expect(toSlug(undefined)).toBe('');
      expect(toSlug(123)).toBe('');
    });

    it('deve converter para minúsculas', () => {
      const result = toSlug('EMPRESA');
      expect(result).toBe('empresa');
    });
  });
});
