import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserController } from '../controller/useUserController';
import http from '../../../shared/services/http';
import {
  Container,
  Card,
  Title,
  Form,
  Field,
  Label,
  Input,
  Select,
  ButtonGroup,
  SubmitButton,
  CancelButton,
  ErrorMessage,
  InfoBox
} from '../styles/UserForm.styles';

export default function UserForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const nav = useNavigate();
  const { createUser, updateUser, fetchUserById, loading, error, setError } = useUserController();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    status: 'ACTIVE',
    companyId: ''
  });

  const [companies, setCompanies] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadCompanies();
    
    if (id) {
      setIsEditMode(true);
      loadUser(id);
    } else {
      // Se for cliente, já preenche com a empresa do usuário logado
      if (user?.role?.startsWith('CLIENT_')) {
        setFormData(prev => ({ ...prev, companyId: user.companyId }));
      }
    }
  }, [id, user]);

  const loadCompanies = async () => {
    try {
      const response = await http.get('/api/empresas');
      setCompanies(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadUser = async (userId) => {
    try {
      const userData = await fetchUserById(userId);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        password: '', // Senha não é retornada
        role: userData.role || '',
        status: userData.status || 'ACTIVE',
        companyId: userData.companyId || ''
      });
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Retorna as roles disponíveis baseado no usuário logado e na empresa selecionada
   */
  const getAvailableRoles = () => {
    const selectedCompany = companies.find(c => c.id === parseInt(formData.companyId));
    const isAccountingCompany = selectedCompany?.codigo === 'EMP001';

    // ACCOUNTING_SUPER: Pode criar todos os tipos
    if (user?.role === 'ACCOUNTING_SUPER') {
      if (isAccountingCompany) {
        return [
          { value: 'ACCOUNTING_SUPER', label: 'Contabilidade - Super Admin' },
          { value: 'ACCOUNTING_ADMIN', label: 'Contabilidade - Admin' },
          { value: 'ACCOUNTING_NORMAL', label: 'Contabilidade - Normal' }
        ];
      } else {
        return [
          { value: 'CLIENT_ADMIN', label: 'Cliente - Admin' },
          { value: 'CLIENT_NORMAL', label: 'Cliente - Normal' }
        ];
      }
    }

    // ACCOUNTING_ADMIN: Pode criar ACCOUNTING_NORMAL, CLIENT_ADMIN, CLIENT_NORMAL
    if (user?.role === 'ACCOUNTING_ADMIN') {
      if (isAccountingCompany) {
        return [
          { value: 'ACCOUNTING_NORMAL', label: 'Contabilidade - Normal' }
        ];
      } else {
        return [
          { value: 'CLIENT_ADMIN', label: 'Cliente - Admin' },
          { value: 'CLIENT_NORMAL', label: 'Cliente - Normal' }
        ];
      }
    }

    // CLIENT_ADMIN: Só pode criar CLIENT_NORMAL da própria empresa
    if (user?.role === 'CLIENT_ADMIN') {
      return [
        { value: 'CLIENT_NORMAL', label: 'Cliente - Normal' }
      ];
    }

    return [];
  };

  /**
   * Verifica se o usuário logado pode cadastrar/editar usuários
   */
  const canManageUsers = () => {
    return ['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'CLIENT_ADMIN'].includes(user?.role);
  };

  /**
   * Verifica se deve mostrar o campo de empresa
   * Cliente só vê sua própria empresa
   */
  const canSelectCompany = () => {
    return user?.role?.startsWith('ACCOUNTING_');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!isEditMode && !formData.password) {
      setError('Senha é obrigatória');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!formData.role) {
      setError('Tipo de usuário é obrigatório');
      return;
    }

    if (!formData.companyId) {
      setError('Empresa é obrigatória');
      return;
    }

    try {
      const dataToSend = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        status: formData.status,
        companyId: parseInt(formData.companyId)
      };

      // Só envia senha se foi preenchida
      if (formData.password) {
        dataToSend.password = formData.password;
      }

      if (isEditMode) {
        await updateUser(id, dataToSend);
      } else {
        await createUser(dataToSend);
      }

      nav('/users');
    } catch (err) {
      // Erro já tratado no controller
      console.error('Erro ao salvar usuário:', err);
    }
  };

  if (!canManageUsers()) {
    return (
      <Container>
        <Card>
          <ErrorMessage>Você não tem permissão para gerenciar usuários.</ErrorMessage>
        </Card>
      </Container>
    );
  }

  const availableRoles = getAvailableRoles();
  const selectedCompany = companies.find(c => c.id === parseInt(formData.companyId));

  return (
    <Container>
      <Card>
        <Title>{isEditMode ? 'Editar Usuário' : 'Novo Usuário'}</Title>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          {/* Campo Empresa */}
          {canSelectCompany() ? (
            <Field>
              <Label>Empresa *</Label>
              <Select
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                required
                disabled={isEditMode && user?.role === 'CLIENT_ADMIN'}
              >
                <option value="">Selecione uma empresa</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.codigo} - {company.nome}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <InfoBox>
              <strong>Empresa:</strong> {user?.company?.nome || 'N/A'}
            </InfoBox>
          )}

          {/* Campo Tipo de Usuário */}
          {formData.companyId && (
            <Field>
              <Label>Tipo de Usuário *</Label>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="">Selecione o tipo</option>
                {availableRoles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
              {selectedCompany && (
                <InfoBox>
                  <strong>Empresa selecionada:</strong> {selectedCompany.nome}
                </InfoBox>
              )}
            </Field>
          )}

          {/* Campo Nome */}
          <Field>
            <Label>Nome *</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome completo"
              required
            />
          </Field>

          {/* Campo Email */}
          <Field>
            <Label>Email *</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="usuario@empresa.com"
              required
              autoComplete="off"
            />
          </Field>

          {/* Campo Senha */}
          <Field>
            <Label>
              Senha {isEditMode ? '(deixe em branco para manter a atual)' : '*'}
            </Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required={!isEditMode}
              autoComplete="new-password"
              minLength={6}
            />
          </Field>

          {/* Campo Status (apenas em edição) */}
          {isEditMode && (
            <Field>
              <Label>Status *</Label>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </Select>
            </Field>
          )}

          {/* Botões */}
          <ButtonGroup>
            <CancelButton type="button" onClick={() => nav('/users')}>
              Cancelar
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEditMode ? 'Atualizar' : 'Cadastrar')}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </Card>
    </Container>
  );
}





