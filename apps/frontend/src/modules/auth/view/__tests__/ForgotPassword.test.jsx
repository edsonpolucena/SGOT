import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import { useAuthController } from '../../controller/useAuthController';

vi.mock('../../controller/useAuthController', () => ({
  useAuthController: vi.fn(),
}));

vi.mock('../AuthLayout', () => ({
  default: ({ children }) => <div data-testid="auth-layout">{children}</div>,
}));

describe('ForgotPassword.jsx - 100% Coverage', () => {
  const mockForgotPassword = vi.fn();
  const mockSetErr = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthController.mockReturnValue({
      forgotPassword: mockForgotPassword,
      loading: false,
      err: null,
      setErr: mockSetErr,
    });
  });

  it('deve renderizar formulário de recuperação', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByText('Recuperar senha')).toBeInTheDocument();
    expect(screen.getByText(/Informe seu e-mail/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
  });

  it('deve atualizar email quando digitado', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

    expect(emailInput.value).toBe('test@test.com');
  });

  it('deve enviar email com sucesso', async () => {
    mockForgotPassword.mockResolvedValue({});

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const submitButton = screen.getByText('Enviar');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(screen.getByText(/Se existir uma conta/)).toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando envio falha', () => {
    useAuthController.mockReturnValue({
      forgotPassword: mockForgotPassword,
      loading: false,
      err: 'Email não encontrado',
      setErr: mockSetErr,
    });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByText('Email não encontrado')).toBeInTheDocument();
  });

  it('deve mostrar loading durante envio', () => {
    useAuthController.mockReturnValue({
      forgotPassword: mockForgotPassword,
      loading: true,
      err: null,
      setErr: mockSetErr,
    });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByText('Enviando...')).toBeInTheDocument();
    expect(screen.getByText('Enviar').closest('button').disabled).toBe(true);
  });

  it('deve limpar erro e ok antes de enviar', async () => {
    mockForgotPassword.mockResolvedValue({});

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const submitButton = screen.getByText('Enviar');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetErr).toHaveBeenCalledWith(null);
    });
  });

  it('deve lidar com erro silenciosamente', async () => {
    mockForgotPassword.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const submitButton = screen.getByText('Enviar');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalled();
    });
  });
});

