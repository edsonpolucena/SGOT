import { useEffect, useState } from 'react';
import http from '../../../shared/services/http';
import { arrayToCsv, downloadBlob, openPrintWindowWithTable } from '../../../shared/utils/exportUtils';
import { useAuth } from '../../../shared/context/AuthContext';
import { useAuditController } from '../controller/useAuditController';
import WelcomeCard from '../../../shared/ui/WelcomeCard';
import { FaUserShield } from "react-icons/fa";
import {
  Container,
  Header,
  Title,
  FiltersContainer,
  FilterInput,
  FilterSelect,
  FilterButton,
  ClearButton,
  Table,
  Th,
  Td,
  ActionBadge,
  EntityBadge,
  LoadingMessage,
  ErrorMessage,
  EmptyMessage,
  Pagination,
  MetadataButton,
  MetadataModal,
  MetadataContent,
  ExportActions,
  ExportButton
} from '../styles/AuditLog.styles';

export default function AuditLog() {
  const { user } = useAuth();
  const { logs, loading, error, pagination, fetchLogs, setError } = useAuditController();

  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });

  const [selectedMetadata, setSelectedMetadata] = useState(null);

  useEffect(() => {
    // Verificar se usuário é ACCOUNTING_SUPER
    if (user?.role !== 'ACCOUNTING_SUPER') {
      setError('Você não tem permissão para acessar logs de auditoria');
      return;
    }

    loadLogs();
  }, [user, filters.page]);

  const loadLogs = () => {
    fetchLogs(filters);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      entity: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50
    });
    setTimeout(() => fetchLogs({}), 100);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const exportColumns = [
    { key: 'createdAt', header: 'Data e Hora' },
    { key: 'userName', header: 'Usuário' },
    { key: 'userEmail', header: 'Email' },
    { key: 'action', header: 'Ação' },
    { key: 'entity', header: 'Entidade' },
    { key: 'entityId', header: 'ID Entidade' },
  ];

  const fetchAllLogsForExport = async () => {
    const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    let page = 1;
    const limit = 500;
    let aggregated = [];
    while (true) {
      const p = new URLSearchParams(params);
      p.append('page', page);
      p.append('limit', String(limit));
      const { data } = await http.get(`${PREFIX}/audit/logs?${p.toString()}`);
      aggregated = aggregated.concat(data.logs || []);
      if (page >= (data.totalPages || 1)) break;
      page += 1;
    }
    return aggregated;
  };

  const handleExportExcel = async () => {
    try {
      const all = await fetchAllLogsForExport();
      const rows = all.map(l => ({
        createdAt: new Date(l.createdAt).toLocaleString('pt-BR'),
        userName: l.userName || '',
        userEmail: l.userEmail || '',
        action: formatAction(l.action),
        entity: formatEntity(l.entity),
        entityId: l.entityId || '',
      }));
      const csv = arrayToCsv(rows);
      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
      downloadBlob(csv, `logs_auditoria_${ts}.csv`, 'text/csv;charset=utf-8;');
    } catch (e) {
      alert('Falha ao exportar Excel.');
    }
  };

  const handleExportPdf = async () => {
    try {
      const all = await fetchAllLogsForExport();
      const rows = all.map(l => ({
        createdAt: new Date(l.createdAt).toLocaleString('pt-BR'),
        userName: l.userName || '',
        userEmail: l.userEmail || '',
        action: formatAction(l.action),
        entity: formatEntity(l.entity),
        entityId: l.entityId || '',
      }));
      openPrintWindowWithTable('Logs de Auditoria', exportColumns, rows);
    } catch (e) {
      alert('Falha ao exportar PDF.');
    }
  };

  const formatAction = (action) => {
    const actionMap = {
      'CREATE': 'Criação',
      'UPDATE': 'Atualização',
      'DELETE': 'Exclusão',
      'VIEW': 'Visualização',
      'DOWNLOAD': 'Download',
      'UPLOAD': 'Upload',
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',
      'STATUS_CHANGE': 'Mudança Status'
    };
    return actionMap[action] || action;
  };

  const formatEntity = (entity) => {
    const entityMap = {
      'Obligation': 'Obrigação',
      'User': 'Usuário',
      'ObligationFile': 'Arquivo',
      'Company': 'Empresa',
      'Auth': 'Autenticação'
    };
    return entityMap[entity] || entity;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role !== 'ACCOUNTING_SUPER') {
    return (
      <Container>
        <ErrorMessage>
          Você não tem permissão para acessar logs de auditoria. Esta área é restrita ao Super Admin.
        </ErrorMessage>
      </Container>
    );
  }

  if (loading && logs.length === 0) {
    return (
      <Container>
        <LoadingMessage>Carregando logs de auditoria...</LoadingMessage>
      </Container>
    );
  }

  return (
    <>
      <WelcomeCard
        title={`Bem-vindo(a), ${user?.name}`}
        subtitle="Rastreie todas as ações realizadas no sistema"
      />
      <Container>
        <Header>
          <Title> <FaUserShield/> Logs de Auditoria</Title>
        </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Filtros */}
      <FiltersContainer>
        <div>
          <label>Ação:</label>
          <FilterSelect
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">Todas</option>
            <option value="CREATE">Criação</option>
            <option value="UPDATE">Atualização</option>
            <option value="DELETE">Exclusão</option>
            <option value="VIEW">Visualização</option>
            <option value="DOWNLOAD">Download</option>
            <option value="UPLOAD">Upload</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="STATUS_CHANGE">Mudança Status</option>
          </FilterSelect>
        </div>

        <div>
          <label>Entidade:</label>
          <FilterSelect
            value={filters.entity}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
          >
            <option value="">Todas</option>
            <option value="Obligation">Obrigação</option>
            <option value="User">Usuário</option>
            <option value="ObligationFile">Arquivo</option>
            <option value="Company">Empresa</option>
            <option value="Auth">Autenticação</option>
          </FilterSelect>
        </div>

        <div>
          <label>Data Início:</label>
          <FilterInput
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>

        <div>
          <label>Data Fim:</label>
          <FilterInput
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        <FilterButton onClick={handleApplyFilters}>Filtrar</FilterButton>
        <ClearButton onClick={handleClearFilters}>Limpar</ClearButton>
      </FiltersContainer>

      <ExportActions>
        <ExportButton $variant="pdf" onClick={handleExportPdf}>Exportar PDF</ExportButton>
        <ExportButton $variant="excel" onClick={handleExportExcel}>Exportar Excel</ExportButton>
      </ExportActions>

      {/* Tabela */}
      {logs.length === 0 ? (
        <EmptyMessage>Nenhum log encontrado com os filtros aplicados.</EmptyMessage>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Data e Hora</Th>
                <Th>Usuário</Th>
                <Th>Ação</Th>
                <Th>Entidade</Th>
                <Th>ID Entidade</Th>
                <Th>Detalhes</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <Td>{formatDate(log.createdAt)}</Td>
                  <Td>
                    <div style={{ fontWeight: '500' }}>{log.userName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                      {log.userEmail}
                    </div>
                  </Td>
                  <Td>
                    <ActionBadge $action={log.action}>
                      {formatAction(log.action)}
                    </ActionBadge>
                  </Td>
                  <Td>
                    <EntityBadge $entity={log.entity}>
                      {formatEntity(log.entity)}
                    </EntityBadge>
                  </Td>
                  <Td style={{ fontSize: '0.85rem', color: '#6b7280', fontFamily: 'monospace' }}>
                    {log.entityId.substring(0, 8)}...
                  </Td>
                  <Td>
                    {log.metadata ? (
                      <MetadataButton onClick={() => setSelectedMetadata(log.metadata)}>
                        Ver Detalhes
                      </MetadataButton>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>-</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Paginação */}
          <Pagination>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Anterior
            </button>
            <span>
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Próxima
            </button>
          </Pagination>
        </>
      )}

      {/* Modal de Metadata */}
      {selectedMetadata && (
        <MetadataModal onClick={() => setSelectedMetadata(null)}>
          <MetadataContent onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes da Ação</h3>
            <pre>{JSON.stringify(selectedMetadata, null, 2)}</pre>
            <button onClick={() => setSelectedMetadata(null)}>Fechar</button>
          </MetadataContent>
        </MetadataModal>
      )}
    </Container>
    </>
  );
}

