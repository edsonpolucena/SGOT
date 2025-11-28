import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserList from '../UserList';
import { useUserController } from '../../controller/useUserController';
import { useAuth } from '../../../../shared/context/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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

vi.mock('react-icons/fa', () => ({
  FaUsersCog: () => <span data-testid="fa-users-cog">UsersCog</span>,
  FaPlus: () => <span data-testid="fa-plus">Plus</span>,
  FaEdit: () => <span data-testid="fa-edit">Edit</span>,
  FaToggleOn: () => <span data-testid="fa-toggle-on">ToggleOn</span>,
  FaToggleOff: () => <span data-testid="fa-toggle-off">ToggleOff</span>,
}));

describe('UserList.jsx - 100% Coverage', () => {
  const mockFetchUsers = vi.fn();
  const mockUpdateUserStatus = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.window.confirm = vi.fn(() => true);

    useAuth.mockReturnValue({
      user: {
        name: 'Test User',
        role: 'ACCOUNTING_SUPER',
      },
    });

    useUserController.mockReturnValue({
      users: [],
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });
  });

  it('deve renderizar loading', () => {
    useUserController.mockReturnValue({
      users: [],
      loading: true,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument();
  });

  it('deve renderizar erro', () => {
    useUserController.mockReturnValue({
      users: [],
      loading: false,
      error: 'Erro ao carregar',
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Erro ao carregar')).toBeInTheDocument();
  });

  it('deve carregar usuários ao montar', () => {
    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(mockFetchUsers).toHaveBeenCalledWith({});
  });

  it('deve exibir lista de usuários', async () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
      {
        id: 2,
        name: 'User 2',
        email: 'user2@test.com',
        role: 'CLIENT_ADMIN',
        status: 'INACTIVE',
        company: { nome: 'Empresa 2' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem quando não há usuários', () => {
    useUserController.mockReturnValue({
      users: [],
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Nenhum usuário encontrado.')).toBeInTheDocument();
  });

  it('deve mostrar coluna de empresa para ACCOUNTING_', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('Empresa 1')).toBeInTheDocument();
  });

  it('deve não mostrar coluna de empresa para CLIENT_ADMIN', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Client Admin',
        role: 'CLIENT_ADMIN',
      },
    });

    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.queryByText('Empresa')).not.toBeInTheDocument();
  });

  it('deve formatar role corretamente', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
      {
        id: 2,
        name: 'User 2',
        email: 'user2@test.com',
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 2' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Contabilidade - Super')).toBeInTheDocument();
    expect(screen.getByText('Cliente - Normal')).toBeInTheDocument();
  });

  it('deve exibir status badge corretamente', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
      {
        id: 2,
        name: 'User 2',
        email: 'user2@test.com',
        role: 'CLIENT_ADMIN',
        status: 'INACTIVE',
        company: { nome: 'Empresa 2' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('deve mostrar botão novo usuário para ACCOUNTING_SUPER', () => {
    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
  });

  it('deve mostrar botão novo usuário para ACCOUNTING_ADMIN', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Admin User',
        role: 'ACCOUNTING_ADMIN',
      },
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
  });

  it('deve mostrar botão novo usuário para CLIENT_ADMIN', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Client Admin',
        role: 'CLIENT_ADMIN',
      },
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
  });

  it('deve navegar para novo usuário ao clicar no botão', () => {
    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    const newButton = screen.getByText('Novo Usuário');
    fireEvent.click(newButton);

    expect(mockNavigate).toHaveBeenCalledWith('/users/new');
  });

  it('deve navegar para edição ao clicar no botão editar', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    const editButtons = screen.getAllByTestId('fa-edit');
    fireEvent.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/users/edit/1');
  });

  it('deve alterar status ao clicar no toggle', async () => {
    mockUpdateUserStatus.mockResolvedValue({});

    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    const toggleButtons = screen.getAllByTestId('fa-toggle-on');
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(global.window.confirm).toHaveBeenCalledWith('Deseja desativar este usuário?');
      expect(mockUpdateUserStatus).toHaveBeenCalledWith(1, 'INACTIVE');
      expect(mockFetchUsers).toHaveBeenCalled();
    });
  });

  it('deve ativar usuário inativo', async () => {
    mockUpdateUserStatus.mockResolvedValue({});

    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'INACTIVE',
        company: { nome: 'Empresa 1' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    const toggleButtons = screen.getAllByTestId('fa-toggle-off');
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(global.window.confirm).toHaveBeenCalledWith('Deseja ativar este usuário?');
      expect(mockUpdateUserStatus).toHaveBeenCalledWith(1, 'ACTIVE');
    });
  });

  it('deve não alterar status se usuário cancelar confirmação', async () => {
    global.window.confirm = vi.fn(() => false);

    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    const toggleButtons = screen.getAllByTestId('fa-toggle-on');
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(global.window.confirm).toHaveBeenCalled();
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });
  });

  it('deve aplicar filtro de status', async () => {
    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const statusFilter = screen.getByLabelText('Status:');
      fireEvent.change(statusFilter, { target: { value: 'ACTIVE' } });
    });

    await waitFor(() => {
      expect(mockFetchUsers).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });
  });

  it('deve aplicar filtro de role', async () => {
    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const roleFilter = screen.getByLabelText('Tipo:');
      fireEvent.change(roleFilter, { target: { value: 'ACCOUNTING_NORMAL' } });
    });

    await waitFor(() => {
      expect(mockFetchUsers).toHaveBeenCalledWith({ role: 'ACCOUNTING_NORMAL' });
    });
  });

  it('deve mostrar filtros de role corretos para ACCOUNTING_SUPER', () => {
    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    const roleFilter = screen.getByLabelText('Tipo:');
    fireEvent.click(roleFilter);

    expect(screen.getByText('Contabilidade - Super')).toBeInTheDocument();
    expect(screen.getByText('Contabilidade - Admin')).toBeInTheDocument();
    expect(screen.getByText('Contabilidade - Normal')).toBeInTheDocument();
  });

  it('deve mostrar filtros de role corretos para ACCOUNTING_ADMIN', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Admin User',
        role: 'ACCOUNTING_ADMIN',
      },
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    const roleFilter = screen.getByLabelText('Tipo:');
    fireEvent.click(roleFilter);

    // ACCOUNTING_ADMIN não vê ACCOUNTING_SUPER
    expect(screen.queryByText('Contabilidade - Super')).not.toBeInTheDocument();
  });

  it('deve negar acesso se usuário não tem permissão', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Normal User',
        role: 'CLIENT_NORMAL',
      },
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Você não tem permissão para acessar esta página.')).toBeInTheDocument();
  });

  it('deve negar acesso se usuário não existe', () => {
    useAuth.mockReturnValue({
      user: null,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('Você não tem permissão para acessar esta página.')).toBeInTheDocument();
  });

  it('deve exibir N/A quando empresa não existe', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'ACTIVE',
        company: null,
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('deve recarregar lista após alterar status', async () => {
    mockUpdateUserStatus.mockResolvedValue({});
    vi.clearAllMocks();

    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@test.com',
        role: 'ACCOUNTING_NORMAL',
        status: 'ACTIVE',
        company: { nome: 'Empresa 1' },
      },
    ];

    useUserController.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      updateUserStatus: mockUpdateUserStatus,
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    );

    const toggleButtons = screen.getAllByTestId('fa-toggle-on');
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      // Deve chamar fetchUsers após updateUserStatus
      expect(mockFetchUsers).toHaveBeenCalled();
    });
  });
});

