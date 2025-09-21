import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../../shared/context/AuthContext";
import http from "../../../shared/services/http";
import WelcomeCard from "../../../shared/ui/WelcomeCard";

const DashboardContainer = styled.div`
  padding: 20px;
`;


const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${(props) => props.color || "#667eea"};
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${(props) => props.color || "#333"};
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const Th = styled.th`
  padding: 12px;
  text-align: left;
  background: #f9fafb;
  cursor: pointer;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eee;
`;

const Pagination = styled.div`
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;

  button {
    padding: 6px 12px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 6px;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function Dashboard() {
  const { user, isAccounting, isClient } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalObligations: 0,
    pendingObligations: 0,
    lateObligations: 0,
    paidObligations: 0,
  });
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (isClient) {
      navigate("/dashboard/client", { replace: true });
      return;
    }
    loadDashboardData();
  }, [isClient, navigate]);

  const loadDashboardData = async () => {
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

      setStats({
        totalObligations: obligations.length,
        pendingObligations: obligations.filter((o) => o.status === "PENDING").length,
        lateObligations: obligations.filter((o) => o.status === "LATE").length,
        paidObligations: obligations.filter((o) => o.status === "PAID").length,
      });

      setObligations(obligations);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
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
    .filter((o) => {
      return (
        o.companyCode?.toLowerCase().includes(search.toLowerCase()) ||
        o.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        o.docType?.toLowerCase().includes(search.toLowerCase()) ||
        o.competence?.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;

      let aVal, bVal;
      switch (sortColumn) {
        case "createdAt":
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case "companyCode":
          aVal = a.companyCode || "";
          bVal = b.companyCode || "";
          break;
        case "docType":
          aVal = a.docType || "";
          bVal = b.docType || "";
          break;
        case "competence":
          aVal = a.competence || "";
          bVal = b.competence || "";
          break;
        case "dueDate":
          aVal = new Date(a.dueDate);
          bVal = new Date(b.dueDate);
          break;
        case "amount":
          aVal = a.amount || 0;
          bVal = b.amount || 0;
          break;
        default:
          aVal = "";
          bVal = "";
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredObligations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredObligations.length / itemsPerPage);

  if (loading) {
    return <DashboardContainer>Carregando dashboard...</DashboardContainer>;
  }

  return (
    <DashboardContainer>
      <WelcomeCard
      title={`Bem-vindo(a), ${user?.name}`}
      subtitle="Gerencie todas as obrigações tributárias"
    />


      <StatsGrid>
        <StatCard color="#667eea">
          <StatNumber color="#667eea">{stats.totalObligations}</StatNumber>
          <StatLabel>Total de Obrigações</StatLabel>
        </StatCard>
        <StatCard color="#f59e0b">
          <StatNumber color="#f59e0b">{stats.pendingObligations}</StatNumber>
          <StatLabel>Pendentes</StatLabel>
        </StatCard>
        <StatCard color="#ef4444">
          <StatNumber color="#ef4444">{stats.lateObligations}</StatNumber>
          <StatLabel>Em Atraso</StatLabel>
        </StatCard>
        <StatCard color="#10b981">
          <StatNumber color="#10b981">{stats.paidObligations}</StatNumber>
          <StatLabel>Pagas</StatLabel>
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

      <Table>
        <thead>
          <tr>
            <Th onClick={() => handleSort("createdAt")}>Data Upload</Th>
            <Th onClick={() => handleSort("companyCode")}>Empresa</Th>
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
              <Td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                Nenhuma obrigação encontrada
              </Td>
            </tr>
          ) : (
            currentItems.map((o) => (
              <tr key={o.id}>
                <Td>{new Date(o.createdAt).toLocaleDateString("pt-BR")}</Td>
                <Td>{o.companyCode} - {o.companyName}</Td>
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
                  <button>👁️ Visualizar</button>
                  <button>⬇️ Download</button>
                  <button style={{ color: "red" }}>🗑️ Excluir</button>
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
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Próxima
        </button>
      </Pagination>
    </DashboardContainer>
  );
}
