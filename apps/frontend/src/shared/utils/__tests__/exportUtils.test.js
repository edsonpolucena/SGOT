import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { arrayToCsv, downloadBlob, openPrintWindowWithTable } from '../exportUtils';

describe('exportUtils.js - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock do DOM
    global.document = {
      createElement: vi.fn(),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };
    global.URL = {
      createObjectURL: vi.fn(() => 'blob:url'),
      revokeObjectURL: vi.fn(),
    };
    global.Blob = class Blob {
      constructor(content, options) {
        this.content = content;
        this.options = options;
      }
    };
    global.window = {
      open: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('arrayToCsv', () => {
    it('deve converter array de objetos para CSV', () => {
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const result = arrayToCsv(rows);
      expect(result).toContain('name,age');
      expect(result).toContain('John,30');
      expect(result).toContain('Jane,25');
    });

    it('deve escapar valores com vírgula', () => {
      const rows = [{ name: 'John, Doe', age: 30 }];
      const result = arrayToCsv(rows);
      expect(result).toContain('"John, Doe"');
    });

    it('deve escapar valores com aspas', () => {
      const rows = [{ name: 'John "Johnny" Doe', age: 30 }];
      const result = arrayToCsv(rows);
      expect(result).toContain('"John ""Johnny"" Doe"');
    });

    it('deve escapar valores com quebra de linha', () => {
      const rows = [{ name: 'John\nDoe', age: 30 }];
      const result = arrayToCsv(rows);
      expect(result).toContain('"John\nDoe"');
    });

    it('deve lidar com valores null', () => {
      const rows = [{ name: null, age: 30 }];
      const result = arrayToCsv(rows);
      expect(result).toContain(',30');
    });

    it('deve lidar com valores undefined', () => {
      const rows = [{ name: undefined, age: 30 }];
      const result = arrayToCsv(rows);
      expect(result).toContain(',30');
    });

    it('deve retornar string vazia quando rows é null', () => {
      expect(arrayToCsv(null)).toBe('');
    });

    it('deve retornar string vazia quando rows é undefined', () => {
      expect(arrayToCsv(undefined)).toBe('');
    });

    it('deve retornar string vazia quando rows é array vazio', () => {
      expect(arrayToCsv([])).toBe('');
    });

    it('deve converter números para string', () => {
      const rows = [{ value: 123 }];
      const result = arrayToCsv(rows);
      expect(result).toContain('123');
    });
  });

  describe('downloadBlob', () => {
    it('deve criar blob e fazer download', () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      global.document.createElement.mockReturnValue(mockLink);

      downloadBlob('content', 'file.csv', 'text/csv');

      expect(global.document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe('file.csv');
      expect(global.document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(global.document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('deve usar tipo padrão quando não fornecido', () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      global.document.createElement.mockReturnValue(mockLink);

      downloadBlob('content', 'file.csv');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('deve revogar URL após timeout', async () => {
      vi.useFakeTimers();
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      global.document.createElement.mockReturnValue(mockLink);

      downloadBlob('content', 'file.csv');

      vi.advanceTimersByTime(1000);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
      vi.useRealTimers();
    });
  });

  describe('openPrintWindowWithTable', () => {
    it('deve abrir janela de impressão com tabela', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      };
      global.window.open.mockReturnValue(mockWindow);

      const columns = [
        { key: 'name', header: 'Nome' },
        { key: 'age', header: 'Idade' },
      ];
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      openPrintWindowWithTable('Título', columns, rows);

      expect(global.window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.document.close).toHaveBeenCalled();
      expect(mockWindow.focus).toHaveBeenCalled();
      expect(mockWindow.print).toHaveBeenCalled();
    });

    it('deve retornar quando window.open retorna null', () => {
      global.window.open.mockReturnValue(null);

      openPrintWindowWithTable('Título', [], []);

      expect(global.window.open).toHaveBeenCalled();
    });

    it('deve incluir título no HTML', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      };
      global.window.open.mockReturnValue(mockWindow);

      openPrintWindowWithTable('Meu Título', [], []);

      const writeCalls = mockWindow.document.write.mock.calls;
      const html = writeCalls.map(call => call[0]).join('');
      expect(html).toContain('Meu Título');
    });

    it('deve criar thead corretamente', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      };
      global.window.open.mockReturnValue(mockWindow);

      const columns = [{ key: 'name', header: 'Nome' }];
      openPrintWindowWithTable('Título', columns, []);

      const writeCalls = mockWindow.document.write.mock.calls;
      const html = writeCalls.map(call => call[0]).join('');
      expect(html).toContain('<th>Nome</th>');
    });

    it('deve criar tbody corretamente', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      };
      global.window.open.mockReturnValue(mockWindow);

      const columns = [{ key: 'name', header: 'Nome' }];
      const rows = [{ name: 'John' }];
      openPrintWindowWithTable('Título', columns, rows);

      const writeCalls = mockWindow.document.write.mock.calls;
      const html = writeCalls.map(call => call[0]).join('');
      expect(html).toContain('<td>John</td>');
    });

    it('deve lidar com valores undefined/null nas células', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      };
      global.window.open.mockReturnValue(mockWindow);

      const columns = [{ key: 'name', header: 'Nome' }];
      const rows = [{ name: undefined }];
      openPrintWindowWithTable('Título', columns, rows);

      const writeCalls = mockWindow.document.write.mock.calls;
      const html = writeCalls.map(call => call[0]).join('');
      expect(html).toContain('<td></td>');
    });
  });
});
