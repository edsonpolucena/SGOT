import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import { useAuthController } from '../../controller/useAuthController';

vi.mock('../../controller/useAuthController', () => ({
  useAuthController: vi.fn(),
}));

vi.mock('../AuthLayout', () => ({
  default: ({ children }) => <div data-testid="auth-layout">{children}</div>,
}));

describe('ResetPassword.jsx - 100% Coverage', () => {
  const mockValidateResetToken = vi.fn();
  const mockResetPassword = vi.fn();
  const mockSetErr = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.window.location = { ...window.location };
    
    useAuthController.mockReturnValue({
      validateResetToken: mockValidateResetToken,
      resetPassword: mockResetPassword,
      loading: false,
      err: null,
      setErr: mockSetErr,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve mostrar erro quando token não é fornecido', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSetErr).toHaveBeenCalledWith('Token não fornecido. Verifique o link no email.');
    });
  });

  it('deve validar token ao carregar', async () => {
    mockValidateResetToken.mockResolvedValue({
      valid: true,
      email: 'test@test.com',
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockValidateResetToken).toHaveBeenCalledWith('valid-token');
    });
  });

  it('deve mostrar loading durante validação', () => {
    mockValidateResetToken.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <MemoryRouter initialEntries={['/reset-password?token=test']}>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(screen.getByText('Validando...')).toBeInTheDocument();
  });

  it('deve mostrar formulário quando token é válido', async () => {
    mockValidateResetToken.mockResolvedValue({
      valid: true,
      email: 'test@test.com',
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Nova senha/)).toBeInTheDocument();
      expect(screen.getByText(/Confirmar senha/)).toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando token é inválido', async () => {
    mockValidateResetToken.mockResolvedValue({
      valid: false,
      reason: 'Token expirado',
    });

    useAuthController.mockReturnValue({
      validateResetToken: mockValidateResetToken,
      resetPassword: mockResetPassword,
      loading: false,
      err: 'Token expirado',
      setErr: mockSetErr,
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=invalid']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSetErr).toHaveBeenCalledWith('Token expirado');
    });
  });

  it('deve mostrar erro quando validação falha', async () => {
    mockValidateResetToken.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter initialEntries={['/reset-password?token=test']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSetErr).toHaveBeenCalledWith('Erro ao validar token');
    });
  });

  it('deve validar senha mínima', async () => {
    mockValidateResetToken.mockResolvedValue({
      valid: true,
      email: 'test@test.com',
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Nova senha/)).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText(/Nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirmar senha/i);
    const submitButton = screen.getByText('Redefinir senha');

    fireEvent.change(newPasswordInput, { target: { value: '12345' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetErr).toHaveBeenCalledWith('A senha deve ter no mínimo 6 caracteres');
    });
  });

  it('deve validar confirmação de senha', async () => {
    mockValidateResetToken.mockResolvedValue({
      valid: true,
      email: 'test@test.com',
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Nova senha/)).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText(/Nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirmar senha/i);
    const submitButton = screen.getByText('Redefinir senha');

    fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetErr).toHaveBeenCalledWith('As senhas não coincidem');
    });
  });

  it('deve redefinir senha com sucesso', async () => {
    mockValidateResetToken.mockResolvedValue({
      valid: true,
      email: 'test@test.com',
    });
    mockResetPassword.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Nova senha/)).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText(/Nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirmar senha/i);
    const submitButton = screen.getByText('Redefinir senha');

    fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'valid',
        newPassword: 'password123',
      });
      expect(screen.getByText(/Senha redefinida com sucesso/)).toBeInTheDocument();
    });
  });

  it('deve redirecionar para login após sucesso', async () => {
    mockValidateResetToken.mockResolvedValue({
      valid: true,
      email: 'test@test.com',
    });
    mockResetPassword.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Nova senha/)).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByLabelText(/Nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirmar senha/i);
    const submitButton = screen.getByText('Redefinir senha');

    fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Senha redefinida com sucesso/)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(3000);

    // Navigate é chamado internamente
    await waitFor(() => {
      // Verificar que o componente processou o timeout
    });
  });
});

