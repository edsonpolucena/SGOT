import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { useUserController } from '../controller/useUserController';
import {
  Container,
  Header,
  Title,
  NewButton,
  FiltersContainer,
  FilterSelect,
  Table,
  Th,
  Td,
  StatusBadge,
  RoleBadge,
  ActionButton,
  LoadingMessage,
  ErrorMessage,
  EmptyMessage
} from '../styles/UserList.styles';
import { FaPlus, FaEdit, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function UserList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { users, loading, error, fetchUsers, updateUserStatus, setError } = useUserController();

  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [statusFilter, roleFilter]);

  const loadUsers = () => {
    const filters = {};
    if (statusFilter) filters.status = statusFilter;
    if (roleFilter) filters.role = roleFilter;
    fetchUsers(filters);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (window.confirm(`Deseja ${currentStatus === 'ACTIVE' ? 'desativar' : 'ativar'} este usuário?`)) {
      try {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await updateUserStatus(userId, newStatus);
        loadUsers(); // Recarrega a lista
      } catch (err) {
        console.error('Erro ao alterar status:', err);
      }
    }
  };

  /**
   * Verifica se o usuário logado pode criar usuários
   */
  const canCreateUsers = () => {
    return ['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN'].includes(user?.role);
  };

  /**
   * Verifica se deve mostrar coluna de empresa
   */
  const shouldShowCompanyColumn = () => {
    return user?.role?.startsWith('ACCOUNTING_');
  };

  /**
   * Formata o nome da role para exibição
   */
  const formatRole = (role) => {
    const roleMap = {
      'ACCOUNTING_SUPER': 'Contabilidade - Super',
      'ACCOUNTING_ADMIN': 'Contabilidade - Admin',
      'ACCOUNTING_NORMAL': 'Contabilidade - Normal',
      'CLIENT_ADMIN': 'Cliente - Admin',
      'CLIENT_NORMAL': 'Cliente - Normal'
    };
    return roleMap[role] || role;
  };

  /**
   * Retorna cor do badge baseado na role
   */
  const getRoleBadgeColor = (role) => {
    if (role?.startsWith('ACCOUNTING_')) return '#1976d2';
    if (role === 'CLIENT_ADMIN') return '#f57c00';
    return '#757575';
  };

  // Verificar se o usuário tem permissão para ver esta página
  if (!user || (!user.role.startsWith('ACCOUNTING_') && user.role !== 'CLIENT_ADMIN')) {
    return (
      <Container>
        <ErrorMessage>Você não tem permissão para acessar esta página.</ErrorMessage>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Carregando usuários...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>Gerenciamento de Usuários</Title>
        </div>
        {canCreateUsers() && (
          <NewButton onClick={() => nav('/users/new')}>
            <FaPlus /> Novo Usuário
          </NewButton>
        )}
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Filtros */}
      <FiltersContainer>
        <div>
          <label>Status:</label>
          <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </FilterSelect>
        </div>

        <div>
          <label>Tipo:</label>
          <FilterSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Todos</option>
            {user?.role === 'ACCOUNTING_SUPER' && (
              <>
                <option value="ACCOUNTING_SUPER">Contabilidade - Super</option>
                <option value="ACCOUNTING_ADMIN">Contabilidade - Admin</option>
                <option value="ACCOUNTING_NORMAL">Contabilidade - Normal</option>
              </>
            )}
            <option value="CLIENT_ADMIN">Cliente - Admin</option>
            <option value="CLIENT_NORMAL">Cliente - Normal</option>
          </FilterSelect>
        </div>
      </FiltersContainer>

      {/* Tabela */}
      {users.length === 0 ? (
        <EmptyMessage>Nenhum usuário encontrado.</EmptyMessage>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              {shouldShowCompanyColumn() && <Th>Empresa</Th>}
              <Th>Tipo</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((userItem) => (
              <tr key={userItem.id}>
                <Td>{userItem.name}</Td>
                <Td>{userItem.email}</Td>
                {shouldShowCompanyColumn() && (
                  <Td>{userItem.company?.nome || 'N/A'}</Td>
                )}
                <Td>
                  <RoleBadge color={getRoleBadgeColor(userItem.role)}>
                    {formatRole(userItem.role)}
                  </RoleBadge>
                </Td>
                <Td>
                  <StatusBadge $status={userItem.status}>
                    {userItem.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </StatusBadge>
                </Td>
                <Td>
                  <ActionButton
                    onClick={() => nav(`/users/edit/${userItem.id}`)}
                    title="Editar usuário"
                  >
                    <FaEdit />
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleToggleStatus(userItem.id, userItem.status)}
                    title={userItem.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                  >
                    {userItem.status === 'ACTIVE' ? <FaToggleOn /> : <FaToggleOff />}
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}





