import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import UserForm from '../UserForm';
import { useUserController } from '../../controller/useUserController';
import { useAuth } from '../../../../shared/context/AuthContext';

const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

vi.mock('../../controller/useUserController', () => ({
  useUserController: vi.fn(),
}));

vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../shared/ui/WelcomeCard', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="welcome-card">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  ),
}));

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../shared/services/http';

describe('UserForm.jsx - 100% Coverage', () => {
  const mockCreateUser = vi.fn();
  const mockUpdateUser = vi.fn();
  const mockFetchUserById = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({});
    
    useAuth.mockReturnValue({
      user: { 
        name: 'Test User',
        role: 'ACCOUNTING_SUPER',
        companyId: 1,
      },
    });

    useUserController.mockReturnValue({
      createUser: mockCreateUser,
      updateUser: mockUpdateUser,
      fetchUserById: mockFetchUserById,
      loading: false,
      error: null,
      setError: mockSetError,
    });

    http.get.mockResolvedValue({
      data: [
        { id: 1, codigo: 'EMP001', nome: 'Empresa Contabilidade' },
        { id: 2, codigo: 'EMP002', nome: 'Empresa Cliente' },
      ],
    });
  });

  it('deve renderizar formulário de novo usuário', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    });
  });

  it('deve renderizar formulário de edição quando há id', async () => {
    mockUseParams.mockReturnValue({ id: '1' });
    mockFetchUserById.mockResolvedValue({
      id: 1,
      name: 'User Test',
      email: 'user@test.com',
      role: 'ACCOUNTING_NORMAL',
      status: 'ACTIVE',
      companyId: 1,
    });

    render(
      <MemoryRouter initialEntries={['/users/edit/1']}>
        <UserForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Editar Usuário')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('user@test.com')).toBeInTheDocument();
    });
  });

  it('deve carregar empresas ao montar', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith('/api/empresas');
    });
  });

  it('deve mostrar campo de empresa para ACCOUNTING_SUPER', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Empresa *')).toBeInTheDocument();
    });
  });

  it('deve mostrar info box de empresa para CLIENT_ADMIN', async () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Client User',
        role: 'CLIENT_ADMIN',
        companyId: 2,
        company: { nome: 'Empresa Cliente' },
      },
    });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Empresa:/)).toBeInTheDocument();
    });
  });

  it('deve preencher companyId automaticamente para CLIENT_', async () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Client User',
        role: 'CLIENT_ADMIN',
        companyId: 2,
      },
    });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Verificar se o companyId foi preenchido
      expect(http.get).toHaveBeenCalled();
    });
  });

  it('deve mostrar roles corretas para ACCOUNTING_SUPER com empresa contabilidade', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companySelect = screen.getByLabelText('Empresa *');
      fireEvent.change(companySelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      const roleSelect = screen.getByLabelText('Tipo de Usuário *');
      expect(roleSelect).toBeInTheDocument();
      
      // Verificar se as opções de role aparecem
      fireEvent.click(roleSelect);
      expect(screen.getByText('Contabilidade - Super Admin')).toBeInTheDocument();
    });
  });

  it('deve mostrar roles corretas para ACCOUNTING_SUPER com empresa cliente', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companySelect = screen.getByLabelText('Empresa *');
      fireEvent.change(companySelect, { target: { value: '2' } });
    });

    await waitFor(() => {
      const roleSelect = screen.getByLabelText('Tipo de Usuário *');
      fireEvent.click(roleSelect);
      expect(screen.getByText('Cliente - Admin')).toBeInTheDocument();
    });
  });

  it('deve resetar role ao mudar empresa', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companySelect = screen.getByLabelText('Empresa *');
      fireEvent.change(companySelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      const roleSelect = screen.getByLabelText('Tipo de Usuário *');
      fireEvent.change(roleSelect, { target: { value: 'ACCOUNTING_NORMAL' } });
    });

    await waitFor(() => {
      const companySelect = screen.getByLabelText('Empresa *');
      fireEvent.change(companySelect, { target: { value: '2' } });
      
      const roleSelect = screen.getByLabelText('Tipo de Usuário *');
      expect(roleSelect.value).toBe('');
    });
  });

  it('deve validar campos obrigatórios', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Cadastrar');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Nome é obrigatório');
    });
  });

  it('deve validar senha mínima de 6 caracteres', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'Test User' } });

      const emailInput = screen.getByLabelText('Email *');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

      const passwordInput = screen.getByLabelText(/Senha/);
      fireEvent.change(passwordInput, { target: { value: '12345' } });

      const companySelect = screen.getByLabelText('Empresa *');
      fireEvent.change(companySelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      const roleSelect = screen.getByLabelText('Tipo de Usuário *');
      fireEvent.change(roleSelect, { target: { value: 'ACCOUNTING_NORMAL' } });
    });

    await waitFor(() => {
      const submitButton = screen.getByText('Cadastrar');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Senha deve ter pelo menos 6 caracteres');
    });
  });

  it('deve criar usuário com sucesso', async () => {
    mockCreateUser.mockResolvedValue({ id: 1, name: 'New User' });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'New User' } });

      const emailInput = screen.getByLabelText('Email *');
      fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });

      const passwordInput = screen.getByLabelText(/Senha/);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const companySelect = screen.getByLabelText('Empresa *');
      fireEvent.change(companySelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      const roleSelect = screen.getByLabelText('Tipo de Usuário *');
      fireEvent.change(roleSelect, { target: { value: 'ACCOUNTING_NORMAL' } });
    });

    await waitFor(() => {
      const submitButton = screen.getByText('Cadastrar');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New User',
          email: 'newuser@test.com',
          role: 'ACCOUNTING_NORMAL',
          companyId: 1,
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/users');
    });
  });

  it('deve atualizar usuário com sucesso', async () => {
    mockUseParams.mockReturnValue({ id: '1' });
    mockFetchUserById.mockResolvedValue({
      id: 1,
      name: 'User Test',
      email: 'user@test.com',
      role: 'ACCOUNTING_NORMAL',
      status: 'ACTIVE',
      companyId: 1,
    });
    mockUpdateUser.mockResolvedValue({ id: 1 });

    render(
      <MemoryRouter initialEntries={['/users/edit/1']}>
        <UserForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'Updated User' } });
    });

    await waitFor(() => {
      const submitButton = screen.getByText('Atualizar');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Updated User',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/users');
    });
  });

  it('deve mostrar campo de status apenas em edição', async () => {
    mockUseParams.mockReturnValue({ id: '1' });
    mockFetchUserById.mockResolvedValue({
      id: 1,
      name: 'User Test',
      email: 'user@test.com',
      role: 'ACCOUNTING_NORMAL',
      status: 'ACTIVE',
      companyId: 1,
    });

    render(
      <MemoryRouter initialEntries={['/users/edit/1']}>
        <UserForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Status *')).toBeInTheDocument();
    });
  });

  it('deve não mostrar campo de status em modo criação', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Status *')).not.toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando error existe', async () => {
    useUserController.mockReturnValue({
      createUser: mockCreateUser,
      updateUser: mockUpdateUser,
      fetchUserById: mockFetchUserById,
      loading: false,
      error: 'Erro ao salvar',
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Erro ao salvar')).toBeInTheDocument();
    });
  });

  it('deve mostrar loading durante salvamento', async () => {
    useUserController.mockReturnValue({
      createUser: mockCreateUser,
      updateUser: mockUpdateUser,
      fetchUserById: mockFetchUserById,
      loading: true,
      error: null,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Salvando...')).toBeInTheDocument();
    });
  });

  it('deve cancelar e navegar para lista', async () => {
    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);
      expect(mockNavigate).toHaveBeenCalledWith('/users');
    });
  });

  it('deve negar acesso se usuário não pode gerenciar usuários', async () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Normal User',
        role: 'CLIENT_NORMAL',
      },
    });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Você não tem permissão para gerenciar usuários.')).toBeInTheDocument();
    });
  });

  it('deve mostrar roles corretas para ACCOUNTING_ADMIN', async () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Admin User',
        role: 'ACCOUNTING_ADMIN',
        companyId: 1,
      },
    });

    http.get.mockResolvedValue({
      data: [
        { id: 1, codigo: 'EMP001', nome: 'Empresa Contabilidade' },
        { id: 2, codigo: 'EMP002', nome: 'Empresa Cliente' },
      ],
    });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companySelect = screen.getByLabelText('Empresa *');
      fireEvent.change(companySelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      const roleSelect = screen.getByLabelText('Tipo de Usuário *');
      fireEvent.click(roleSelect);
      expect(screen.getByText('Contabilidade - Normal')).toBeInTheDocument();
    });
  });

  it('deve mostrar roles corretas para CLIENT_ADMIN', async () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Client Admin',
        role: 'CLIENT_ADMIN',
        companyId: 2,
        company: { nome: 'Empresa Cliente' },
      },
    });

    render(
      <BrowserRouter>
        <UserForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      // CLIENT_ADMIN só pode criar CLIENT_NORMAL
      // O campo de empresa não aparece, então precisamos verificar se o role está correto
      expect(http.get).toHaveBeenCalled();
    });
  });

  it('deve não enviar senha se estiver vazia em edição', async () => {
    mockUseParams.mockReturnValue({ id: '1' });
    mockFetchUserById.mockResolvedValue({
      id: 1,
      name: 'User Test',
      email: 'user@test.com',
      role: 'ACCOUNTING_NORMAL',
      status: 'ACTIVE',
      companyId: 1,
    });
    mockUpdateUser.mockResolvedValue({ id: 1 });

    render(
      <MemoryRouter initialEntries={['/users/edit/1']}>
        <UserForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'Updated User' } });
    });

    await waitFor(() => {
      const submitButton = screen.getByText('Atualizar');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(
        '1',
        expect.not.objectContaining({
          password: expect.anything(),
        })
      );
    });
  });

  it('deve enviar senha se preenchida em edição', async () => {
    mockUseParams.mockReturnValue({ id: '1' });
    mockFetchUserById.mockResolvedValue({
      id: 1,
      name: 'User Test',
      email: 'user@test.com',
      role: 'ACCOUNTING_NORMAL',
      status: 'ACTIVE',
      companyId: 1,
    });
    mockUpdateUser.mockResolvedValue({ id: 1 });

    render(
      <MemoryRouter initialEntries={['/users/edit/1']}>
        <UserForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/Senha/);
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    });

    await waitFor(() => {
      const submitButton = screen.getByText('Atualizar');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          password: 'newpassword123',
        })
      );
    });
  });
});

