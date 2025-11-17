import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useObligationActions } from '../useObligationActions';
import http from '../../services/http';

vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', role: 'ACCOUNTING_SUPER' },
    isClient: false
  })
}));

global.alert = vi.fn();
global.confirm = vi.fn();
global.prompt = vi.fn();

describe('useObligationActions', () => {
  let actions;

  beforeEach(() => {
    vi.clearAllMocks();
    const { result } = renderHook(() => useObligationActions());
    actions = result.current;
  });

  describe('handleViewObligation', () => {
    it('deve visualizar arquivo único', async () => {
      const mockFile = { id: 'file1', originalName: 'doc.pdf' };
      http.get.mockResolvedValueOnce({ data: [mockFile] });
      http.get.mockResolvedValueOnce({ data: { viewUrl: 'http://view-url.com' } });

      const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => {});

      await actions.handleViewObligation('obl123');

      expect(http.get).toHaveBeenCalledWith('/api/obligations/obl123/files');
      expect(http.get).toHaveBeenCalledWith('/api/obligations/files/file1/view');
      expect(mockWindowOpen).toHaveBeenCalledWith('http://view-url.com', '_blank');

      mockWindowOpen.mockRestore();
    });

    it('deve alertar se não houver arquivos', async () => {
      http.get.mockResolvedValueOnce({ data: [] });

      await actions.handleViewObligation('obl123');

      expect(global.alert).toHaveBeenCalledWith('Esta obrigação não possui arquivos anexados.');
    });

    it('deve permitir selecionar arquivo de múltiplos', async () => {
      const mockFiles = [
        { id: 'file1', originalName: 'doc1.pdf' },
        { id: 'file2', originalName: 'doc2.pdf' }
      ];
      http.get.mockResolvedValueOnce({ data: mockFiles });
      http.get.mockResolvedValueOnce({ data: { viewUrl: 'http://view-url.com' } });

      global.prompt.mockReturnValue('2'); // Usuário escolhe o segundo arquivo
      const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => {});

      await actions.handleViewObligation('obl123');

      expect(global.prompt).toHaveBeenCalled();
      expect(http.get).toHaveBeenCalledWith('/api/obligations/files/file2/view');
      expect(mockWindowOpen).toHaveBeenCalled();

      mockWindowOpen.mockRestore();
    });

    it('deve tratar erro ao visualizar', async () => {
      http.get.mockRejectedValueOnce(new Error('Network error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await actions.handleViewObligation('obl123');

      expect(global.alert).toHaveBeenCalledWith('Erro ao visualizar arquivo. Tente novamente.');
    });
  });

  describe('handleDownloadFiles', () => {
    it('deve fazer download de arquivos', async () => {
      const mockFiles = [{ id: 'file1', originalName: 'doc1.pdf' }];

      http.get.mockResolvedValueOnce({ data: mockFiles });
      http.get.mockResolvedValue({ data: { downloadUrl: 'http://download-url.com' } });

      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockLink = {
        href: '',
        download: '',
        style: {},
        click: vi.fn()
      };
      createElementSpy.mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      await actions.handleDownloadFiles('obl123');

      expect(http.get).toHaveBeenCalledWith('/api/obligations/obl123/files');

      createElementSpy.mockRestore();
    });

    it('deve alertar se não houver arquivos', async () => {
      http.get.mockResolvedValueOnce({ data: [] });

      await actions.handleDownloadFiles('obl123');

      expect(global.alert).toHaveBeenCalledWith('Esta obrigação não possui arquivos anexados.');
    });

    it('deve fazer download de múltiplos arquivos', async () => {
      const mockFiles = [
        { id: 'file1', originalName: 'doc1.pdf' },
        { id: 'file2', originalName: 'doc2.pdf' }
      ];

      http.get.mockResolvedValueOnce({ data: mockFiles });
      http.get.mockResolvedValue({ data: { downloadUrl: 'http://download.com' } });

      const mockLink = {
        href: '',
        download: '',
        style: {},
        click: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      await actions.handleDownloadFiles('obl123');

      expect(http.get).toHaveBeenCalledTimes(3); // Lista + 2 downloads
      expect(global.alert).toHaveBeenCalledWith('2 arquivos iniciaram o download.');
    });

    it('deve tratar erro no download', async () => {
      http.get.mockRejectedValueOnce(new Error('Network error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await actions.handleDownloadFiles('obl123');

      expect(global.alert).toHaveBeenCalledWith('Erro ao baixar arquivos. Tente novamente.');
    });

    it('deve continuar download mesmo se um arquivo falhar', async () => {
      const mockFiles = [
        { id: 'file1', originalName: 'doc1.pdf' },
        { id: 'file2', originalName: 'doc2.pdf' }
      ];

      http.get.mockResolvedValueOnce({ data: mockFiles });
      http.get.mockRejectedValueOnce(new Error('File error')); // Primeiro falha
      http.get.mockResolvedValueOnce({ data: { downloadUrl: 'http://download.com' } }); // Segundo funciona

      const mockLink = { href: '', download: '', style: {}, click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await actions.handleDownloadFiles('obl123');

      expect(http.get).toHaveBeenCalledTimes(3); // Lista + 2 downloads
    });
  });

  describe('handleDeleteObligation', () => {
    it('deve excluir obrigação com confirmação', async () => {
      global.confirm.mockReturnValue(true);
      const mockFiles = [{ id: 'file1', originalName: 'doc.pdf' }];
      http.get.mockResolvedValueOnce({ data: mockFiles });
      http.delete.mockResolvedValue({ data: { message: 'Sucesso' } });

      const onSuccess = vi.fn();

      await actions.handleDeleteObligation('obl123', onSuccess);

      expect(http.get).toHaveBeenCalledWith('/api/obligations/obl123/files');
      expect(http.delete).toHaveBeenCalledWith('/api/obligations/files/file1');
      expect(http.delete).toHaveBeenCalledWith('/api/obligations/obl123');
      expect(onSuccess).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Obrigação excluída com sucesso!');
    });

    it('não deve excluir se usuário cancelar', async () => {
      global.confirm.mockReturnValue(false);

      const onSuccess = vi.fn();

      await actions.handleDeleteObligation('obl123', onSuccess);

      expect(http.get).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('deve continuar exclusão mesmo se arquivo falhar', async () => {
      global.confirm.mockReturnValue(true);
      const mockFiles = [
        { id: 'file1', originalName: 'doc1.pdf' },
        { id: 'file2', originalName: 'doc2.pdf' }
      ];
      
      http.get.mockResolvedValueOnce({ data: mockFiles });
      http.delete.mockRejectedValueOnce(new Error('File error')); // Primeiro falha
      http.delete.mockResolvedValue({ data: {} }); // Outros funcionam
      
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onSuccess = vi.fn();

      await actions.handleDeleteObligation('obl123', onSuccess);

      expect(http.delete).toHaveBeenCalledTimes(3); // 2 arquivos + 1 obrigação
      expect(onSuccess).toHaveBeenCalled();
    });

    it('deve tratar erro ao deletar obrigação', async () => {
      global.confirm.mockReturnValue(true);
      http.get.mockResolvedValueOnce({ data: [] });
      http.delete.mockRejectedValueOnce(new Error('Delete error'));
      
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await actions.handleDeleteObligation('obl123');

      expect(global.alert).toHaveBeenCalledWith('Erro ao excluir obrigação. Tente novamente.');
    });
  });
});

