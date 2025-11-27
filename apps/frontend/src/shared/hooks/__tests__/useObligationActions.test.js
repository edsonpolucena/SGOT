import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useObligationActions } from '../useObligationActions';
import http from '../../services/http';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn()
  }
}));

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock de window.alert e window.confirm
global.alert = vi.fn();
global.confirm = vi.fn();
global.window.open = vi.fn();
global.prompt = vi.fn();

describe('useObligationActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { email: 'test@test.com' },
      isClient: false
    });
  });

  it('deve inicializar com alertComponent', () => {
    const { result } = renderHook(() => useObligationActions());

    expect(result.current.alertComponent).toBeDefined();
    expect(result.current.handleViewObligation).toBeDefined();
    expect(result.current.handleDownloadFiles).toBeDefined();
    expect(result.current.handleDeleteObligation).toBeDefined();
  });

  describe('checkClientHistory', () => {
    it('deve retornar shouldShow false quando não é cliente', async () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'test@test.com' },
        isClient: false
      });

      const { result } = renderHook(() => useObligationActions());
      
      // checkClientHistory é privado, mas podemos testar através de handleViewObligation
      http.get.mockResolvedValue({ data: [] });

      await act(async () => {
        await result.current.handleViewObligation('1');
      });

      expect(http.get).toHaveBeenCalled();
    });

    it('deve verificar histórico quando é cliente', async () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'client@test.com' },
        isClient: true
      });

      const { result } = renderHook(() => useObligationActions());
      const mockHistory = [
        { userEmail: 'other@test.com', userName: 'Other User', action: 'VIEW' }
      ];
      
      http.get
        .mockResolvedValueOnce({ data: mockHistory }) // client-views
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] }); // files

      await act(async () => {
        await result.current.handleViewObligation('1');
      });

      expect(http.get).toHaveBeenCalledWith('/api/obligations/1/client-views');
    });
  });

  describe('handleViewObligation', () => {
    it('deve abrir arquivo único em nova aba', async () => {
      const { result } = renderHook(() => useObligationActions());
      
      http.get
        .mockResolvedValueOnce({ data: [] }) // client-views (não é cliente)
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] }) // files
        .mockResolvedValueOnce({ data: { viewUrl: 'https://example.com/file.pdf' } }); // view

      await act(async () => {
        await result.current.handleViewObligation('1');
      });

      expect(window.open).toHaveBeenCalledWith('https://example.com/file.pdf', '_blank');
    });

    it('deve mostrar alert quando não há arquivos', async () => {
      const { result } = renderHook(() => useObligationActions());
      
      http.get
        .mockResolvedValueOnce({ data: [] }) // client-views
        .mockResolvedValueOnce({ data: [] }); // files

      await act(async () => {
        await result.current.handleViewObligation('1');
      });

      expect(global.alert).toHaveBeenCalledWith('Esta obrigação não possui arquivos anexados.');
    });

    it('deve tratar erro corretamente', async () => {
      const { result } = renderHook(() => useObligationActions());
      
      http.get.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.handleViewObligation('1');
      });

      expect(global.alert).toHaveBeenCalledWith('Erro ao visualizar arquivo. Tente novamente.');
    });
  });

  describe('handleDownloadFiles', () => {
    it('deve baixar arquivos quando é cliente sem histórico', async () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'client@test.com' },
        isClient: true
      });

      const { result } = renderHook(() => useObligationActions());
      
      // Mock de document.createElement
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      http.get
        .mockResolvedValueOnce({ data: [] }) // client-views
        .mockResolvedValueOnce({ data: [{ id: '1', originalName: 'file.pdf' }] }) // files
        .mockResolvedValueOnce({ data: { downloadUrl: 'https://example.com/file.pdf' } }); // download

      await act(async () => {
        await result.current.handleDownloadFiles('1');
      });

      expect(http.get).toHaveBeenCalledWith('/api/obligations/1/files');
    });
  });

  describe('handleDeleteObligation', () => {
    it('não deve deletar quando usuário cancela', async () => {
      const { result } = renderHook(() => useObligationActions());
      global.confirm.mockReturnValue(false);

      await act(async () => {
        await result.current.handleDeleteObligation('1');
      });

      expect(http.delete).not.toHaveBeenCalled();
    });

    it('deve deletar obrigação quando confirmado', async () => {
      const { result } = renderHook(() => useObligationActions());
      global.confirm.mockReturnValue(true);

      http.get.mockResolvedValue({ data: [] }); // files
      http.delete.mockResolvedValue({ data: { success: true } });

      await act(async () => {
        await result.current.handleDeleteObligation('1');
      });

      expect(http.delete).toHaveBeenCalledWith('/api/obligations/1');
      expect(global.alert).toHaveBeenCalledWith('Obrigação excluída com sucesso!');
    });

    it('deve chamar onSuccess após deletar', async () => {
      const { result } = renderHook(() => useObligationActions());
      const onSuccess = vi.fn();
      global.confirm.mockReturnValue(true);

      http.get.mockResolvedValue({ data: [] });
      http.delete.mockResolvedValue({ data: { success: true } });

      await act(async () => {
        await result.current.handleDeleteObligation('1', onSuccess);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
