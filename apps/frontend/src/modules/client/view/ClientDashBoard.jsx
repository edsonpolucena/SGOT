import { useEffect, useState } from "react";
import styled from "styled-components";
import { useAuth } from "../../../shared/context/AuthContext";
import http from "../../../shared/services/http";
import WelcomeCard from "../../../shared/ui/WelcomeCard"; 
import { FaEye, FaDownload } from "../../../shared/icons";
import IconButton from "../../../shared/ui/IconButton";
import IconGroup from "../../../shared/ui/IconGroup";
import { useMonthlySummary } from "../../analytics/hooks/useAnalyticsData.js";
import TaxesPieChart from "../../analytics/components/charts/TaxesPieChart";
import { useMonthlyVariationByTax } from "../../analytics/hooks/useAnalyticsData";
import VariationByTaxChart from "../../analytics/components/charts/VariationByTaxChart";
import { useObligationActions } from "../../../shared/hooks/useObligationActions";
import {
  StatsGrid,
  StatCard,
  Table,
  Th,
  Td,
  Pagination
} from "../../../shared/styles/DashboardCommon.styles";

import {
  Wrapper,
  Header,
  CompanyInfo,
  LogoutBtn,
  Dashboard,
  Card,
  Calendar,
} from '../styles/ClientDashboard.styles.js';

export default function ClientDashboard() {
  const { user } = useAuth();
  const empresaId = user?.company?.id;
  const { handleViewObligation, handleDownloadFiles } = useObligationActions();
  
  // Obter mês atual no formato YYYY-MM
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Hooks de analytics - só executam se empresaId existir
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } =
    useMonthlySummary(empresaId, currentMonth);
  const { data: variationByTaxData, loading: variationByTaxLoading, error: variationByTaxError } =
    useMonthlyVariationByTax(empresaId, currentMonth);
  
  const [obligations, setObligations] = useState([]);

  const stats = {
  totalObligations: obligations.length,
  pendingObligations: obligations.filter(o => o.status === "PENDING").length,
  lateObligations: obligations.filter(o => o.status === "LATE").length,
  paidObligations: obligations.filter(o => o.status === "PAID").length,
};
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadObligations();
  }, []);

  const loadObligations = async () => {
    try {
      setLoading(true);
      const response = await http.get("/api/obligations");

      const obligations = response.data.map((o) => {
        let notes = {};
        try {
          notes = JSON.parse(o.notes || "{}");
        } catch (e) {}

        return {
          ...o,
          companyCode: notes.companyCode || "",
          docType: notes.docType || "",
          competence: notes.competence || "",
          cnpj: notes.cnpj || "",
          companyName: notes.companyName || "",
        };
      });

      setObligations(obligations);
    } catch (err) {
      console.error("Erro ao carregar obrigações:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleSort = (col) => {
    const order = sortColumn === col && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(col);
    setSortOrder(order);
  };

  const filteredObligations = [...obligations]
    .filter((o) =>
      o.docType?.toLowerCase().includes(search.toLowerCase()) ||
      o.competence?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortColumn) return 0;
      let aVal = a[sortColumn], bVal = b[sortColumn];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredObligations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredObligations.length / itemsPerPage);

  // ==== Calendário de vencimentos ====
  const formatYmd = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const obligationsByDate = (() => {
    const map = {};
    for (const o of obligations) {
      if (!o?.dueDate) continue;
      const key = formatYmd(new Date(o.dueDate));
      if (!map[key]) map[key] = [];
      map[key].push(o);
    }
    return map;
  })();

  const buildMonthMatrix = (monthDate) => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const start = new Date(firstDay);
    const startWeekday = (start.getDay() + 6) % 7; // segunda-feira = 0
    start.setDate(start.getDate() - startWeekday);
    const weeks = [];
    let cursor = new Date(start);
    for (let w = 0; w < 6; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(days);
    }
    return weeks;
  };

  const monthWeeks = buildMonthMatrix(calendarMonth);

  return (
    <>
      <WelcomeCard
        variant="client"
        title={`Bem-vindo(a), ${user?.name}`}
        subtitle="Acompanhe suas obrigações tributárias"
        info={[
          `Email: ${user?.email}`,
          `Empresa: ${user?.company?.nome}`,
          `CNPJ: ${user?.company?.cnpj}`,
          `Código: ${user?.company?.codigo}`,
        ]}
      />

      <Wrapper>

      <StatsGrid>
        {/* Calendário de Vencimentos */}
        <StatCard color="#ef4444">
          <h4 style={{ marginBottom: "8px", color: "#ef4444", fontSize: "0.95rem" }}>
            Calendário de Vencimentos
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              style={{ padding: '4px 8px', border: '1px solid #ddd', background: 'white', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ◀
            </button>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
              {calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              style={{ padding: '4px 8px', border: '1px solid #ddd', background: 'white', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ▶
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>{d}</div>
            ))}

            {monthWeeks.map((week, wi) => (
              week.map((day, di) => {
                const inMonth = day.getMonth() === calendarMonth.getMonth();
                const key = formatYmd(day);
                const items = obligationsByDate[key] || [];
                const hasDue = items.length > 0;
                return (
                  <button
                    key={wi + '-' + di}
                    onClick={() => hasDue && setSelectedDayInfo({ date: day, items })}
                    disabled={!hasDue}
                    style={{
                      padding: 4,
                      minHeight: 45,
                      background: inMonth ? '#ffffff' : '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: 4,
                      cursor: hasDue ? 'pointer' : 'default',
                      position: 'relative',
                      textAlign: 'left',
                      width: '100%',
                      fontFamily: 'inherit'
                    }}
                    title={hasDue ? `${items.length} obrigação(ões) vence(m) neste dia` : ''}
                    aria-label={hasDue ? `${day.getDate()} - ${items.length} obrigação(ões)` : `${day.getDate()}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{day.getDate()}</span>
                      {hasDue && (
                        <span style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          background: '#ef4444'
                        }} />
                      )}
                    </div>
                    {hasDue && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 9, color: '#111827', fontWeight: 600 }}>
                          {items[0].docType}
                        </div>
                        <div style={{ fontSize: 9, color: '#6b7280' }}>
                          {items[0].competence}
                          {items.length > 1 ? ` +${items.length - 1}` : ''}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            ))}
          </div>

          {selectedDayInfo && (
            <div style={{ marginTop: 8, padding: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem' }}>
                  Obrigações em {selectedDayInfo.date.toLocaleDateString('pt-BR')}
                </strong>
                <button onClick={() => setSelectedDayInfo(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }}>fechar</button>
              </div>
              <ul style={{ margin: '6px 0 0 16px', fontSize: '0.8rem' }}>
                {selectedDayInfo.items.map(it => (
                  <li key={it.id} style={{ marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{it.docType}</span>
                    {' — '}Competência: {it.competence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </StatCard>

        <StatCard color="#3b82f6">
          <h4 style={{ marginBottom: "8px", color: "#3b82f6", fontSize: "0.95rem" }}>
            Comparativo de Valores de Impostos – Mês Atual vs. Mês Anterior (R$)
          </h4>
          {variationByTaxLoading && <p style={{ fontSize: "0.85rem" }}>Carregando...</p>}
          {variationByTaxError && <p style={{ fontSize: "0.85rem" }}>Erro ao carregar dados</p>}
          {variationByTaxData && (
            <VariationByTaxChart data={variationByTaxData.impostos || []} />
          )}
        </StatCard>

        <StatCard color="#3b82f6">
          <h4 style={{ marginBottom: "8px", color: "#3b82f6", fontSize: "0.95rem" }}>
            Distribuição dos Impostos por Tipo (em R$)
          </h4>
          {analyticsData && (
            <p style={{ marginBottom: "10px", fontWeight: "bold", color: "#374151", fontSize: "0.85rem" }}>
              Total arrecadado no mês:{" "}
              R$ {analyticsData.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          )}
          {analyticsLoading ? (<p style={{ fontSize: "0.85rem" }}>Carregando...</p>)
           : analyticsData ? ( <TaxesPieChart data={analyticsData.impostos} /> 
           ) : analyticsError ? ( <p style={{ fontSize: "0.85rem" }}>Erro ao carregar dados</p>) : null
           }
        </StatCard>
      </StatsGrid>

        <h2>Obrigações Recentes</h2>
        <input
          type="text"
          placeholder="Pesquisar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "10px", padding: "8px", width: "100%", maxWidth: "300px" }}
        />

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th onClick={() => handleSort("createdAt")}>Data Upload</Th>
                  <Th onClick={() => handleSort("docType")}>Tipo</Th>
                  <Th onClick={() => handleSort("competence")}>Competência</Th>
                  <Th onClick={() => handleSort("dueDate")}>Vencimento</Th>
                  <Th onClick={() => handleSort("amount")}>Valor</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <Td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      Nenhuma obrigação encontrada
                    </Td>
                  </tr>
                ) : (
                  currentItems.map((o) => (
                    <tr key={o.id}>
                      <Td>{new Date(o.createdAt).toLocaleDateString("pt-BR")}</Td>
                      <Td>{o.docType}</Td>
                      <Td>{o.competence}</Td>
                      <Td>{new Date(o.dueDate).toLocaleDateString("pt-BR")}</Td>
                      <Td>
                        {o.amount
                          ? `R$ ${Number(o.amount).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}`
                          : "-"}
                      </Td>
                       <Td>
                          <IconGroup>
                              <IconButton 
                                icon={FaEye}
                                onClick={() => handleViewObligation(o.id)}
                                title="Visualizar"
                              />
                              <IconButton 
                                icon={FaDownload}
                                onClick={() => handleDownloadFiles(o.id)}
                                title="Download"
                              />
                                    
                          </IconGroup>
                
                </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <Pagination>
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Próxima
              </button>
            </Pagination>
          </>
        )}
      </Wrapper>
    </>
  );
}
