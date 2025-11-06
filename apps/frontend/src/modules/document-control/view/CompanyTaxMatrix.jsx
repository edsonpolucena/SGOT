import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import http from '../../../shared/services/http';
import {
  Page,
  Header,
  Title,
  MonthSelect,
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  StatusIcon,
  Legend,
  LegendItem,
  ExportButton
} from '../styles/CompanyTaxMatrix.styles';
import WelcomeCard from '../../../shared/ui/WelcomeCard';

const TAX_TYPES = [
  { code: 'ICMS', name: 'ICMS' },
  { code: 'ISS', name: 'ISS' },
  { code: 'IRPJ', name: 'IRPJ' },
  { code: 'CSLL', name: 'CSLL' },
  { code: 'PIS_COFINS', name: 'PIS/COFINS' }
];

export default function CompanyTaxMatrix() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${monthStr}`;
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatrix();
  }, [month]);

  async function loadMatrix() {
    try {
      setLoading(true);
      setError('');
      const response = await http.get(`/api/analytics/document-control-dashboard?month=${month}`);
      setData(response.data);
    } catch (err) {
      console.error('Erro ao carregar matriz:', err);
      setError('Erro ao carregar dados da matriz');
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(company, taxType) {
    const obligation = company.obligations?.find(o => o.taxType === taxType);
    
    if (!obligation) {
      // Verifica se esse imposto está no perfil fiscal da empresa
      const expectedTaxes = company.expectedTaxes || [];
      if (expectedTaxes > 0) {
        return { icon: '❌', label: 'Falta Criar', color: '#fee2e2' };
      }
      return { icon: '➖', label: 'Não Configurado', color: '#f3f4f6' };
    }

    if (obligation.status === 'SUBMITTED' || obligation.status === 'PAID' || obligation.hasFile) {
      return { icon: '✅', label: 'Postado', color: '#d1fae5' };
    }
    if (obligation.status === 'NOT_APPLICABLE') {
      return { icon: '🚫', label: 'Não Aplicável', color: '#f3f4f6' };
    }
    if (obligation.status === 'PENDING') {
      return { icon: '⏳', label: 'Pendente', color: '#fef3c7' };
    }
    
    return { icon: '❓', label: 'Desconhecido', color: '#e5e7eb' };
  }

  function exportToCSV() {
    if (!data) return;

    let csv = 'Empresa,' + TAX_TYPES.map(t => t.name).join(',') + '\n';
    
    data.companies.forEach(company => {
      let row = `"${company.companyName}"`;
      TAX_TYPES.forEach(taxType => {
        const status = getStatusIcon(company, taxType.code);
        row += `,"${status.label}"`;
      });
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `matriz-impostos-${month}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  if (loading) {
    return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Matriz de Status - Empresa x Impostos"
        />
        <Page>
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Carregando...
          </div>
        </Page>
      </>
    );
  }

  if (error) {
    return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Matriz de Status - Empresa x Impostos"
        />
        <Page>
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
            {error}
          </div>
        </Page>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      <WelcomeCard
        title={`Bem-vindo(a), ${user?.name}`}
        subtitle="Matriz de Status - Visualize todos os impostos de todas as empresas"
      />
      <Page>
        <Header>
          <Title>📋 Matriz Empresa x Impostos - {formatMonthYear(month)}</Title>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <MonthSelect type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <ExportButton onClick={exportToCSV}>
              📥 Exportar CSV
            </ExportButton>
          </div>
        </Header>

        <Legend>
          <LegendItem>
            <StatusIcon bgColor="#d1fae5">✅</StatusIcon> Postado
          </LegendItem>
          <LegendItem>
            <StatusIcon bgColor="#fef3c7">⏳</StatusIcon> Pendente
          </LegendItem>
          <LegendItem>
            <StatusIcon bgColor="#f3f4f6">🚫</StatusIcon> Não Aplicável
          </LegendItem>
          <LegendItem>
            <StatusIcon bgColor="#fee2e2">❌</StatusIcon> Falta Criar
          </LegendItem>
          <LegendItem>
            <StatusIcon bgColor="#f3f4f6">➖</StatusIcon> Não Configurado
          </LegendItem>
        </Legend>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <TableHeader sticky>Empresa</TableHeader>
                {TAX_TYPES.map(taxType => (
                  <TableHeader key={taxType.code}>{taxType.name}</TableHeader>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.companies.map(company => (
                <tr key={company.companyId}>
                  <TableCell sticky fontWeight="600">
                    {company.companyName}
                  </TableCell>
                  {TAX_TYPES.map(taxType => {
                    const status = getStatusIcon(company, taxType.code);
                    return (
                      <TableCell key={taxType.code} textAlign="center">
                        <StatusIcon bgColor={status.color} title={status.label}>
                          {status.icon}
                        </StatusIcon>
                      </TableCell>
                    );
                  })}
                </tr>
              ))}

              {data.companies.length === 0 && (
                <tr>
                  <TableCell colSpan={TAX_TYPES.length + 1} textAlign="center" color="#6b7280">
                    Nenhuma empresa encontrada para este mês.
                  </TableCell>
                </tr>
              )}
            </tbody>
          </Table>
        </TableContainer>
      </Page>
    </>
  );
}

