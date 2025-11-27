import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { useAuth } from '../../../../shared/context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../AuthLayout', () => ({
  default: ({ children }) => <div data-testid="auth-layout">{children}</div>,
}));

describe('Login.jsx - 100% Coverage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  it('deve renderizar formulário de login', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('Bem Vindo ao SGOT')).toBeInTheDocument();
    expect(screen.getByText('Acesse sua Conta.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('deve atualizar email quando digitado', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

    expect(emailInput.value).toBe('test@test.com');
  });

  it('deve atualizar senha quando digitado', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('Senha');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  it('deve alternar visibilidade da senha', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('Senha');
    const toggleButton = passwordInput.parentElement.querySelector('button');

    expect(passwordInput.type).toBe('password');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('deve alternar checkbox de lembrar', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const rememberCheckbox = screen.getByLabelText('Lembrar de mim');
    expect(rememberCheckbox.checked).toBe(true);
    fireEvent.click(rememberCheckbox);
    expect(rememberCheckbox.checked).toBe(false);
  });

  it('deve fazer login com sucesso', async () => {
    mockLogin.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByText('Entrar');

    fireEvent.change(emailInput, { target: { value: 'TEST@TEST.COM' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com', // lowercase
        password: 'password123',
        remember: true,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('deve mostrar erro quando login falha', async () => {
    const errorMessage = 'Credenciais inválidas';
    mockLogin.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByText('Entrar');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem padrão quando erro não tem message', async () => {
    mockLogin.mockRejectedValue({});

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByText('Entrar');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Falha ao entrar/)).toBeInTheDocument();
    });
  });

  it('deve mostrar loading durante login', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByText('Entrar');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Entrando...')).toBeInTheDocument();
    expect(submitButton.disabled).toBe(true);

    await waitFor(() => {
      expect(screen.getByText('Entrar')).toBeInTheDocument();
    });
  });

  it('deve trim email antes de enviar', async () => {
    mockLogin.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByText('Entrar');

    fireEvent.change(emailInput, { target: { value: '  TEST@TEST.COM  ' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@test.com' })
      );
    });
  });

  it('deve enviar remember como false quando desmarcado', async () => {
    mockLogin.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const rememberCheckbox = screen.getByLabelText('Lembrar de mim');
    fireEvent.click(rememberCheckbox);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByText('Entrar');

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ remember: false })
      );
    });
  });
});

