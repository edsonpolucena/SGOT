import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import WelcomeCard from "../../../shared/ui/WelcomeCard";
import RegisterLayout, { 
  Title, 
  Subtitle, 
  Form, 
  Field, 
  Label, 
  InputContainer, 
  Input, 
  SubmitButton, 
  ErrorMessage, 
  InfoBox, 
  WarningText, 
  DropdownContainer, 
  Dropdown, 
  DropdownItem, 
  CompanyCode, 
  CompanyName, 
  ToggleButton, 
  Footer
} from './RegisterLayout';
import { FaUser, FaLock, FaEnvelope, FaBuilding, FaEye, FaEyeSlash } from "react-icons/fa";
import http from '../../../shared/services/http';

export default function Register() {
  const {user} = useAuth();
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCompanyCode, setSelectedCompanyCode] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('[data-dropdown]')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const loadCompanies = async () => {
    try {
      const response = await http.get('/api/empresas');
      setCompanies(response.data);
      setFilteredCompanies(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleCompanySearch = (searchValue) => {
    setCompanySearch(searchValue);
    setShowDropdown(true);
    
    if (searchValue === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company => 
        company.codigo.toLowerCase().includes(searchValue.toLowerCase()) ||
        company.nome.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  };

  const handleCompanySelect = (company) => {
    setSelectedCompanyCode(company.codigo);
    setCompanySearch(`${company.codigo} - ${company.nome}`);
    setShowDropdown(false);
  };

  const getSelectedCompany = () => {
    return companies.find(company => company.codigo === selectedCompanyCode);
  };

  const getUserRole = () => {
    // Se o código da empresa for "EMP001" (primeira empresa), é contabilidade
    // Caso contrário, é cliente
    return selectedCompanyCode === 'EMP001' ? 'ACCOUNTING' : 'CLIENT';
  };

  const getUserCompanyId = () => {
    const company = getSelectedCompany();
    return company ? company.id : null;
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!selectedCompanyCode) {
      setError('Por favor, selecione uma empresa');
      return;
    }

    if (!name.trim()) {
      setError('Por favor, digite o nome completo');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, digite o email');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const role = getUserRole();
      const companyId = getUserCompanyId();
      
      await register({ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password, 
        role,
        companyId
      });
      nav('/dashboard');
    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error?.response?.status === 409) {
        setError('Este email já está sendo usado. Tente outro email.');
      } else if (error?.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Falha ao registrar usuário. Tente novamente.');
      }
    }
  }

  const selectedCompany = getSelectedCompany();
  const userRole = getUserRole();

  return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Gerencie as empresas cadastradas no sistema"
        />
    <RegisterLayout>
      <Title>Cadastrar Usuário</Title>
      <Subtitle>Preencha os dados abaixo para criar uma nova conta de usuário.</Subtitle>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Form onSubmit={onSubmit}>
        <Field>
          <Label>Empresa *</Label>
          <DropdownContainer data-dropdown>
            <InputContainer>
              <FaBuilding />
              <Input 
                type="text"
                placeholder="Digite o código ou nome da empresa..."
                value={companySearch} 
                onChange={e => handleCompanySearch(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                required
              />
            </InputContainer>
            
            {showDropdown && filteredCompanies.length > 0 && (
              <Dropdown>
                {filteredCompanies.map(company => (
                  <DropdownItem
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                  >
                    <CompanyCode>{company.codigo}</CompanyCode>
                    <CompanyName>{company.nome}</CompanyName>
                  </DropdownItem>
                ))}
              </Dropdown>
            )}
          </DropdownContainer>
        </Field>

        {selectedCompanyCode && (
          <InfoBox>
            <strong>Empresa selecionada:</strong> {selectedCompany?.nome}<br/>
            <strong>Tipo de usuário:</strong> {userRole === 'ACCOUNTING' ? 'Contabilidade' : 'Cliente'}
            {userRole === 'ACCOUNTING' && (
              <WarningText>
                ⚠️ Acesso total ao sistema
              </WarningText>
            )}
          </InfoBox>
        )}

        <Field>
          <Label>Nome completo *</Label>
          <InputContainer>
            <FaUser />
            <Input 
              placeholder="Digite o nome completo do usuário" 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              required 
            />
          </InputContainer>
        </Field>

        <Field>
          <Label>Email *</Label>
          <InputContainer>
            <FaEnvelope />
            <Input 
              type="email" 
              autoComplete="off"
              placeholder="usuario@empresa.com" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
            />
          </InputContainer>
        </Field>

        <Field>
          <Label>Senha *</Label>
          <InputContainer>
            <FaLock />
            <Input 
              type={showPassword ? "text" : "password"}
              autoComplete='new-password'
              placeholder="Mínimo 6 caracteres" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
              minLength={6}
            />
            <ToggleButton type="button" onClick={()=>setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </ToggleButton>
          </InputContainer>
        </Field>

        <SubmitButton type="submit">Cadastrar Usuário</SubmitButton>
      </Form>

    
    </RegisterLayout>
    </>
  );
}
