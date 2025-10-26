import { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useNotificationController } from '../controller/useNotificationController';
import { FaPaperPlane, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import {
  Container,
  Header,
  Title,
  SubTitle,
  FiltersContainer,
  FilterSelect,
  FilterButton,
  ClearButton,
  Table,
  Th,
  Td,
  ActionButton,
  LoadingMessage,
  ErrorMessage,
  SuccessMessage,
  EmptyMessage,
  Badge,
  StatsContainer,
  StatCard
} from '../styles/UnviewedDocs.styles';

export default function UnviewedDocs() {
  const { user } = useAuth();
  const { unviewedDocs, loading, error, fetchUnviewedDocs, resendNotification, setError } = useNotificationController();

  const [filters, setFilters] = useState({
    companyId: ''
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    loadCompanies();
    loadDocs();
  }, []);

  const loadCompanies = async () => {
    try {
      const http = (await import('../../../shared/services/http')).default;
      const response = await http.get('/api/empresas');
      setCompanies(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadDocs = () => {
    fetchUnviewedDocs(filters);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadDocs();
  };

  const handleClearFilters = () => {
    setFilters({ companyId: '' });
    setTimeout(() => fetchUnviewedDocs({}), 100);
  };

  const handleResend = async (obligationId) => {
    if (!confirm('Deseja reenviar a notificação por email para os usuários desta empresa?')) {
      return;
    }

    try {
      setSendingId(obligationId);
      setSuccessMessage('');
      setError(null);

      const result = await resendNotification(obligationId);
      
      setSuccessMessage(`Notificação enviada com sucesso! ${result.sent}/${result.total} emails enviados.`);
      
      // Recarregar lista
      setTimeout(() => {
        loadDocs();
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao reenviar:', err);
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDueDateBadge = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge $type="late">Vencido</Badge>;
    } else if (diffDays <= 7) {
      return <Badge $type="soon">Vence em {diffDays} dias</Badge>;
    }
    return null;
  };

  // Calcular estatísticas
  const stats = {
    total: unviewedDocs.length,
    late: unviewedDocs.filter(doc => new Date(doc.dueDate) < new Date()).length,
    soon: unviewedDocs.filter(doc => {
      const diff = Math.ceil((new Date(doc.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    }).length
  };

  if (loading && unviewedDocs.length === 0) {
    return (
      <Container>
        <LoadingMessage>Carregando documentos não visualizados...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>📄 Documentos Não Visualizados</Title>
          <SubTitle>Documentos postados que ainda não foram visualizados pelos clientes</SubTitle>
        </div>
      </Header>

      {/* Estatísticas */}
      <StatsContainer>
        <StatCard $color="#667eea">
          <h4>Total Não Visualizados</h4>
          <p>{stats.total}</p>
        </StatCard>
        <StatCard $color="#ef4444">
          <h4>Vencidos</h4>
          <p>{stats.late}</p>
        </StatCard>
        <StatCard $color="#f59e0b">
          <h4>Vencem em 7 dias</h4>
          <p>{stats.soon}</p>
        </StatCard>
      </StatsContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      {/* Filtros */}
      <FiltersContainer>
        <div>
          <label>Empresa:</label>
          <FilterSelect
            value={filters.companyId}
            onChange={(e) => handleFilterChange('companyId', e.target.value)}
          >
            <option value="">Todas</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.codigo} - {company.nome}
              </option>
            ))}
          </FilterSelect>
        </div>

        <FilterButton onClick={handleApplyFilters}>Filtrar</FilterButton>
        <ClearButton onClick={handleClearFilters}>Limpar</ClearButton>
      </FiltersContainer>

      {/* Tabela */}
      {unviewedDocs.length === 0 ? (
        <EmptyMessage>
          <FaCheckCircle />
          <div>
            <strong>Nenhum documento não visualizado!</strong>
            <br />
            Todos os documentos foram visualizados pelos clientes.
          </div>
        </EmptyMessage>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Data Upload</Th>
              <Th>Empresa</Th>
              <Th>Tipo</Th>
              <Th>Competência</Th>
              <Th>Vencimento</Th>
              <Th>Postado por</Th>
              <Th style={{ textAlign: 'center' }}>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {unviewedDocs.map((doc) => (
              <tr key={doc.id}>
                <Td>{formatDate(doc.createdAt)}</Td>
                <Td>
                  <div style={{ fontWeight: '500' }}>{doc.companyCode}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {doc.companyName}
                  </div>
                </Td>
                <Td>{doc.docType}</Td>
                <Td>{doc.competence}</Td>
                <Td>
                  <div>{formatDate(doc.dueDate)}</div>
                  {getDueDateBadge(doc.dueDate)}
                </Td>
                <Td>{doc.user?.name || 'N/A'}</Td>
                <Td style={{ textAlign: 'center' }}>
                  <ActionButton
                    onClick={() => handleResend(doc.id)}
                    disabled={sendingId === doc.id}
                    $sending={sendingId === doc.id}
                    title="Reenviar notificação por email"
                  >
                    {sendingId === doc.id ? (
                      <>
                        <FaClock />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Reenviar Aviso
                      </>
                    )}
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




