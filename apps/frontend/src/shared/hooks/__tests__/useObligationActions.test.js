import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useObligationActions } from '../useObligationActions';
import http from '../../services/http';

vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn()
  }
}));

global.alert = vi.fn();
global.confirm = vi.fn();
global.prompt = vi.fn();

describe('useObligationActions', () => {
  let actions;

  beforeEach(() => {
    vi.clearAllMocks();
    actions = useObligationActions();
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
  });
});

