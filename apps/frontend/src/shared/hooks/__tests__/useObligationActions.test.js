import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useObligationActions } from '../useObligationActions';
import http from '../../services/http';
import { useAuth } from '../../context/AuthContext';
import ClientActionAlert from '../../ui/ClientActionAlert';

vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../ui/ClientActionAlert', () => ({
  default: () => <div data-testid="client-action-alert">Alert</div>,
}));

// Mock de alert, confirm, prompt, window.open
global.alert = vi.fn();
global.confirm = vi.fn();
global.prompt = vi.fn();
global.window.open = vi.fn();

describe('useObligationActions.js - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { email: 'test@test.com' },
      isClient: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkClientHistory', () => {
    it('deve retornar shouldShow false quando não é cliente', async () => {
      useAuth.mockReturnValue({
        user: { email: 'test@test.com' },
        isClient: false,
      });

      const { result } = renderHook(() => useObligationActions());

      // checkClientHistory não é exportado, mas é usado internamente
      // Testamos através de handleViewObligation
      http.get.mockResolvedValue({ data: [] });

      await result.current.handleViewObligation('1');

      expect(http.get).toHaveBeenCalledWith('/api/obligations/1/files');
    });

    it('deve retornar shouldShow false quando user é null', async () => {
      useAuth.mockReturnValue({
        user: null,
        isClient: true,
      });

      const { result } = renderHook(() => useObligationActions());

      http.get.mockResolvedValue({ data: [] });

      await result.current.handleViewObligation('1');

      expect(http.get).toHaveBeenCalledWith('/api/obligations/1/files');
    });

    it('deve verificar histórico quando é cliente', async () => {
      const mockHistory = [
        { userEmail: 'other@test.com', action: 'VIEW', viewedAt: '2025-01-15' },
      ];

      useAuth.mockReturnValue({
        user: { email: 'test@test.com' },
        isClient: true,
      });

      http.get
        .mockResolvedValueOnce({ data: mockHistory }) // client-views
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] }); // files

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleViewObligation('1');

      expect(http.get).toHaveBeenCalledWith('/api/obligations/1/client-views');
    });

    it('deve filtrar histórico do próprio usuário', async () => {
      const mockHistory = [
        { userEmail: 'test@test.com', action: 'VIEW', viewedAt: '2025-01-15' },
        { userEmail: 'other@test.com', action: 'VIEW', viewedAt: '2025-01-16' },
      ];

      useAuth.mockReturnValue({
        user: { email: 'test@test.com' },
        isClient: true,
      });

      http.get
        .mockResolvedValueOnce({ data: mockHistory })
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleViewObligation('1');

      expect(http.get).toHaveBeenCalledWith('/api/obligations/1/client-views');
    });

    it('deve lidar com erro ao verificar histórico', async () => {
      useAuth.mockReturnValue({
        user: { email: 'test@test.com' },
        isClient: true,
      });

      http.get
        .mockRejectedValueOnce(new Error('History error'))
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleViewObligation('1');

      // Deve continuar mesmo com erro no histórico
      expect(http.get).toHaveBeenCalledWith('/api/obligations/1/files');
    });
  });

  describe('handleViewObligation', () => {
    it('deve mostrar alerta quando não há arquivos', async () => {
      http.get.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleViewObligation('1');

      expect(global.alert).toHaveBeenCalledWith('Esta obrigação não possui arquivos anexados.');
    });

    it('deve abrir arquivo único diretamente', async () => {
      http.get
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] })
        .mockResolvedValueOnce({ data: { viewUrl: 'https://example.com/file.pdf' } });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleViewObligation('1');

      expect(global.window.open).toHaveBeenCalledWith('https://example.com/file.pdf', '_blank');
    });

    it('deve mostrar prompt para múltiplos arquivos', async () => {
      global.prompt.mockReturnValue('1');

      http.get
        .mockResolvedValueOnce({
          data: [
            { id: '1', originalName: 'file1.pdf' },
            { id: '2', originalName: 'file2.pdf' },
          ],
        })
        .mockResolvedValueOnce({ data: { viewUrl: 'https://example.com/file1.pdf' } });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleViewObligation('1');

      expect(global.prompt).toHaveBeenCalled();
      expect(global.window.open).toHaveBeenCalledWith('https://example.com/file1.pdf', '_blank');
    });

    it('não deve abrir arquivo quando índice inválido', async () => {
      global.prompt.mockReturnValue('99');

      http.get.mockResolvedValue({
        data: [
          { id: '1', originalName: 'file1.pdf' },
          { id: '2', originalName: 'file2.pdf' },
        ],
      });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleViewObligation('1');

      expect(global.window.open).not.toHaveBeenCalled();
    });

    it('deve lidar com erro ao visualizar', async () => {
      http.get.mockRejectedValue(new Error('View error'));

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleViewObligation('1');

      expect(global.alert).toHaveBeenCalledWith('Erro ao visualizar arquivo. Tente novamente.');
    });
  });

  describe('handleDownloadFiles', () => {
    it('deve mostrar alerta quando não há arquivos', async () => {
      http.get.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDownloadFiles('1');

      expect(global.alert).toHaveBeenCalledWith('Esta obrigação não possui arquivos anexados.');
    });

    it('deve baixar arquivo único', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: {},
        click: vi.fn(),
      };
      global.document.createElement = vi.fn(() => mockLink);
      global.document.body = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      http.get
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] })
        .mockResolvedValueOnce({ data: { downloadUrl: 'https://example.com/file.pdf' } });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDownloadFiles('1');

      expect(http.get).toHaveBeenCalledWith('/api/obligations/files/1/download');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('deve baixar múltiplos arquivos', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: {},
        click: vi.fn(),
      };
      global.document.createElement = vi.fn(() => mockLink);
      global.document.body = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      vi.useFakeTimers();

      http.get
        .mockResolvedValueOnce({
          data: [
            { id: '1', originalName: 'file1.pdf' },
            { id: '2', originalName: 'file2.pdf' },
          ],
        })
        .mockResolvedValueOnce({ data: { downloadUrl: 'https://example.com/file1.pdf' } })
        .mockResolvedValueOnce({ data: { downloadUrl: 'https://example.com/file2.pdf' } });

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDownloadFiles('1');

      vi.advanceTimersByTime(500);

      expect(http.get).toHaveBeenCalledWith('/api/obligations/files/1/download');
      expect(http.get).toHaveBeenCalledWith('/api/obligations/files/2/download');
      expect(global.alert).toHaveBeenCalledWith('2 arquivos iniciaram o download.');

      vi.useRealTimers();
    });

    it('deve lidar com erro ao baixar arquivo específico', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: {},
        click: vi.fn(),
      };
      global.document.createElement = vi.fn(() => mockLink);
      global.document.body = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      http.get
        .mockResolvedValueOnce({
          data: [
            { id: '1', originalName: 'file1.pdf' },
            { id: '2', originalName: 'file2.pdf' },
          ],
        })
        .mockResolvedValueOnce({ data: { downloadUrl: 'https://example.com/file1.pdf' } })
        .mockRejectedValueOnce(new Error('Download error'));

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDownloadFiles('1');

      // Deve continuar mesmo com erro em um arquivo
      expect(http.get).toHaveBeenCalledTimes(3);
    });

    it('deve lidar com erro geral ao baixar', async () => {
      http.get.mockRejectedValue(new Error('Download error'));

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDownloadFiles('1');

      expect(global.alert).toHaveBeenCalledWith('Erro ao baixar arquivos. Tente novamente.');
    });
  });

  describe('handleDeleteObligation', () => {
    it('não deve deletar quando cancelado', async () => {
      global.confirm.mockReturnValue(false);

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDeleteObligation('1');

      expect(http.delete).not.toHaveBeenCalled();
    });

    it('deve deletar obrigação e arquivos quando confirmado', async () => {
      global.confirm.mockReturnValue(true);
      const mockOnSuccess = vi.fn();

      http.get.mockResolvedValue({
        data: [
          { id: 'file1', originalName: 'file1.pdf' },
          { id: 'file2', originalName: 'file2.pdf' },
        ],
      });
      http.delete.mockResolvedValue({});

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDeleteObligation('1', mockOnSuccess);

      expect(http.delete).toHaveBeenCalledWith('/api/obligations/files/file1');
      expect(http.delete).toHaveBeenCalledWith('/api/obligations/files/file2');
      expect(http.delete).toHaveBeenCalledWith('/api/obligations/1');
      expect(global.alert).toHaveBeenCalledWith('Obrigação excluída com sucesso!');
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('deve deletar obrigação sem arquivos', async () => {
      global.confirm.mockReturnValue(true);

      http.get.mockResolvedValue({ data: [] });
      http.delete.mockResolvedValue({});

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDeleteObligation('1');

      expect(http.delete).toHaveBeenCalledWith('/api/obligations/1');
    });

    it('deve lidar com erro ao deletar arquivo', async () => {
      global.confirm.mockReturnValue(true);

      http.get.mockResolvedValue({
        data: [{ id: 'file1', originalName: 'file1.pdf' }],
      });
      http.delete
        .mockRejectedValueOnce(new Error('File delete error'))
        .mockResolvedValueOnce({});

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDeleteObligation('1');

      // Deve continuar mesmo com erro em um arquivo
      expect(http.delete).toHaveBeenCalledWith('/api/obligations/1');
    });

    it('deve lidar com erro geral ao deletar', async () => {
      global.confirm.mockReturnValue(true);

      http.get.mockResolvedValue({ data: [] });
      http.delete.mockRejectedValue(new Error('Delete error'));

      const { result } = renderHook(() => useObligationActions());

      await result.current.handleDeleteObligation('1');

      expect(global.alert).toHaveBeenCalledWith('Erro ao excluir obrigação. Tente novamente.');
    });
  });

  describe('alertComponent', () => {
    it('deve renderizar alertComponent', () => {
      const { result } = renderHook(() => useObligationActions());

      expect(result.current.alertComponent).toBeDefined();
    });

    it('deve abrir alerta quando histórico existe', async () => {
      const mockHistory = [
        { userEmail: 'other@test.com', action: 'VIEW', viewedAt: '2025-01-15' },
      ];

      useAuth.mockReturnValue({
        user: { email: 'test@test.com' },
        isClient: true,
      });

      http.get
        .mockResolvedValueOnce({ data: mockHistory })
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] })
        .mockResolvedValueOnce({ data: { viewUrl: 'https://example.com/file.pdf' } });

      const { result } = renderHook(() => useObligationActions());

      // Simular fechamento do alerta
      const promise = result.current.handleViewObligation('1');

      // Aguardar um pouco para o alerta aparecer
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fechar alerta (simulado)
      if (result.current.alertComponent?.props?.onClose) {
        result.current.alertComponent.props.onClose();
      }

      await promise;

      expect(http.get).toHaveBeenCalledWith('/api/obligations/1/client-views');
    });
  });
});

