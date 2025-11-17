import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import http from '../../../shared/services/http';
import WelcomeCard from '../../../shared/ui/WelcomeCard';
import { FaChartBar } from "react-icons/fa";
import { arrayToCsv, downloadBlob, openPrintWindowWithTable } from '../../../shared/utils/exportUtils';
import {
  Page,
  Header,
  Title,
  PeriodSelect,
  StatsGrid,
  StatCard,
  StatValue,
  StatLabel,
  TableContainer,
  Table,
  Th,
  Td,
  VariationBadge,
  ExportActions,
  ExportButton,
  TaxTypeCardsGrid,
  TaxTypeCard,
  LoadingMessage,
  ErrorMessage
} from '../styles/TaxReport.styles';

export default function TaxReport() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.company?.id) {
      loadReport();
    }
  }, [user, months]);

  async function loadReport() {
    try {
      setLoading(true);
      setError('');

      const response = await http.get(`/api/analytics/client-tax-report?companyId=${user.company.id}&months=${months}`);
      setReport(response.data);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      setError('Erro ao carregar relatório de impostos');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleExportExcel = () => {
    if (!report) return;

    const rows = report.monthlyData.map(month => ({
      Mês: month.monthLabel,
      Total: formatCurrency(month.total),
      Variação: month.variation !== null ? `${month.variation > 0 ? '+' : ''}${month.variation}%` : '-',
      ...Object.fromEntries(
        Object.entries(month.byTaxType).map(([tax, value]) => [
          report.taxTypeTotals.find(t => t.taxType === tax)?.taxName || tax,
          formatCurrency(value)
        ])
      )
    }));

    const csv = arrayToCsv(rows);
    const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    downloadBlob(csv, `relatorio_impostos_${ts}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportPdf = () => {
    if (!report) return;

    const columns = [
      { key: 'month', header: 'Mês' },
      { key: 'total', header: 'Total' },
      { key: 'variation', header: 'Variação' }
    ];

    const rows = report.monthlyData.map(month => ({
      month: month.monthLabel,
      total: formatCurrency(month.total),
      variation: month.variation !== null ? `${month.variation > 0 ? '+' : ''}${month.variation}%` : '-'
    }));

    openPrintWindowWithTable(`Relatório de Impostos - ${report.companyName}`, columns, rows);
  };

  if (loading) {
    return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Relatório de Impostos"
        />
        <Page>
          <LoadingMessage>Carregando relatório...</LoadingMessage>
        </Page>
      </>
    );
  }

  if (error) {
    return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Relatório de Impostos"
        />
        <Page>
          <ErrorMessage>{error}</ErrorMessage>
        </Page>
      </>
    );
  }

  if (!report) return null;

  return (
    <>
      <WelcomeCard
        title={`Bem-vindo(a), ${user?.name}`}
        subtitle={`Relatório de Impostos - ${report.companyName}`}
      />
      <Page>
        <Header>
          <Title> <FaChartBar/> Relatório de Impostos</Title>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <PeriodSelect value={months} onChange={(e) => setMonths(parseInt(e.target.value))}>
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
              <option value={24}>Últimos 24 meses</option>
            </PeriodSelect>
          </div>
        </Header>

        {/* Card com total geral */}
        <StatsGrid>
          <StatCard $color="#667eea">
            <StatValue>{formatCurrency(report.grandTotal)}</StatValue>
            <StatLabel>Total Geral ({months} meses)</StatLabel>
          </StatCard>
          <StatCard $color="#10b981">
            <StatValue>{report.monthlyData.length}</StatValue>
            <StatLabel>Meses Analisados</StatLabel>
          </StatCard>
          <StatCard $color="#f59e0b">
            <StatValue>
              {formatCurrency(
                report.grandTotal / report.monthlyData.filter(m => m.total > 0).length || 0
              )}
            </StatValue>
            <StatLabel>Média Mensal</StatLabel>
          </StatCard>
        </StatsGrid>

        {/* Cards por tipo de imposto */}
        <div style={{ marginTop: '30px' }}>
          <h3>Total por Tipo de Imposto</h3>
          <TaxTypeCardsGrid>
            {report.taxTypeTotals.map(tax => (
              <TaxTypeCard key={tax.taxType}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  {tax.taxName}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#667eea' }}>
                  {formatCurrency(tax.total)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                  {((tax.total / report.grandTotal) * 100).toFixed(1)}% do total
                </div>
              </TaxTypeCard>
            ))}
          </TaxTypeCardsGrid>
        </div>

        {/* Botões de exportação */}
        <ExportActions>
          <ExportButton onClick={handleExportPdf} $variant="pdf">
             Exportar PDF
          </ExportButton>
          <ExportButton onClick={handleExportExcel} $variant="excel">
             Exportar Excel
          </ExportButton>
        </ExportActions>

        {/* Tabela de evolução mensal */}
        <div style={{ marginTop: '30px' }}>
          <h3>Evolução Mensal</h3>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th>Mês</Th>
                  <Th style={{ textAlign: 'right' }}>Total</Th>
                  <Th style={{ textAlign: 'center' }}>Variação</Th>
                  {report.taxTypeTotals.map(tax => (
                    <Th key={tax.taxType} style={{ textAlign: 'right' }}>
                      {tax.taxName}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.monthlyData.map((month, index) => (
                  <tr key={month.month}>
                    <Td>{month.monthLabel}</Td>
                    <Td style={{ textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(month.total)}
                    </Td>
                    <Td style={{ textAlign: 'center' }}>
                      {month.variation !== null ? (
                        <VariationBadge $positive={month.variation >= 0}>
                          {month.variation > 0 ? '+' : ''}{month.variation}%
                        </VariationBadge>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </Td>
                    {report.taxTypeTotals.map(tax => (
                      <Td key={tax.taxType} style={{ textAlign: 'right' }}>
                        {month.byTaxType[tax.taxType] 
                          ? formatCurrency(month.byTaxType[tax.taxType])
                          : '-'
                        }
                      </Td>
                    ))}
                  </tr>
                ))}
                {/* Linha de totais */}
                <tr style={{ borderTop: '2px solid #374151', fontWeight: 'bold', background: '#f9fafb' }}>
                  <Td>TOTAL</Td>
                  <Td style={{ textAlign: 'right', color: '#667eea' }}>
                    {formatCurrency(report.grandTotal)}
                  </Td>
                  <Td>-</Td>
                  {report.taxTypeTotals.map(tax => (
                    <Td key={tax.taxType} style={{ textAlign: 'right', color: '#667eea' }}>
                      {formatCurrency(tax.total)}
                    </Td>
                  ))}
                </tr>
              </tbody>
            </Table>
          </TableContainer>
        </div>
      </Page>
    </>
  );
}

