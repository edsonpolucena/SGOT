import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../../shared/context/AuthContext";
import http from "../../../shared/services/http";
import WelcomeCard from "../../../shared/ui/WelcomeCard";
import { FaEye, FaDownload, FaTrashAlt } from "../../../shared/icons";
import IconButton from "../../../shared/ui/IconButton";
import IconGroup from "../../../shared/ui/IconGroup";




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
          placeholder: Boolean(notes.placeholder),
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

  // Função para visualizar obrigação
  const handleViewObligation = async (obligationId) => {
    try {
      // Buscar arquivos da obrigação
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      if (files.length === 0) {
        alert('Esta obrigação não possui arquivos anexados.');
        return;
      }
      
      // Se há apenas um arquivo, abrir diretamente
      if (files.length === 1) {
        const viewResponse = await http.get(`/api/obligations/files/${files[0].id}/view`);
        window.open(viewResponse.data.viewUrl, '_blank');
        return;
      }
      
      // Se há múltiplos arquivos, mostrar lista simples
      const fileNames = files.map((file, index) => `${index + 1}. ${file.originalName}`).join('\n');
      const choice = prompt(`Múltiplos arquivos encontrados:\n\n${fileNames}\n\nDigite o número do arquivo (1-${files.length}):`);
      
      const fileIndex = parseInt(choice) - 1;
      if (fileIndex >= 0 && fileIndex < files.length) {
        const selectedFile = files[fileIndex];
        const viewResponse = await http.get(`/api/obligations/files/${selectedFile.id}/view`);
        window.open(viewResponse.data.viewUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error);
      alert('Erro ao visualizar arquivo. Tente novamente.');
    }
  };

  // Função para download de arquivos
  const handleDownloadFiles = async (obligationId) => {
    try {
      // Buscar arquivos da obrigação
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      if (files.length === 0) {
        alert('Esta obrigação não possui arquivos anexados.');
        return;
      }
      
      // Baixar todos os arquivos sequencialmente
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const downloadResponse = await http.get(`/api/obligations/files/${file.id}/download`);
          
          // Criar link temporário para download direto
          const link = document.createElement('a');
          link.href = downloadResponse.data.downloadUrl;
          link.download = file.originalName;
          link.style.display = 'none';
          
          // Adicionar ao DOM, clicar e remover
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Pequena pausa entre downloads para evitar conflitos
          if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (fileError) {
          console.error(`Erro ao baixar arquivo ${file.originalName}:`, fileError);
        }
      }
      
      if (files.length > 1) {
        alert(`${files.length} arquivos iniciaram o download.`);
      }
    } catch (error) {
      console.error('Erro ao baixar arquivos:', error);
      alert('Erro ao baixar arquivos. Tente novamente.');
    }
  };

  // Função para excluir obrigação
  const handleDeleteObligation = async (obligationId) => {
    if (!confirm('Tem certeza que deseja excluir esta obrigação? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // Primeiro, excluir todos os arquivos da obrigação
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      for (const file of files) {
        try {
          await http.delete(`/api/obligations/files/${file.id}`);
        } catch (fileError) {
          console.error(`Erro ao excluir arquivo ${file.originalName}:`, fileError);
        }
      }
      
      // Depois, excluir a obrigação
      await http.delete(`/api/obligations/${obligationId}`);
      
      // Recarregar dados
      await loadDashboardData();
      
      alert('Obrigação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir obrigação:', error);
      alert('Erro ao excluir obrigação. Tente novamente.');
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
        case "postedBy":
          aVal = a.user?.name || "";
          bVal = b.user?.name || "";
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

  // ===== Compliance (Cumprimento Geral) =====
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const isInCurrentMonth = (o) => {
    const d = new Date(o.dueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const monthObligations = obligations.filter(isInCurrentMonth);
  const totalExpected = monthObligations.length || 0;
  const completedOrPlaceholder = monthObligations.filter(
    (o) => o.placeholder || (o.status && o.status !== "PENDING")
  ).length;
  const compliancePercent = totalExpected
    ? Math.round((completedOrPlaceholder / totalExpected) * 100)
    : 0;

  const complianceColor = compliancePercent >= 90
    ? "#10b981" // verde
    : compliancePercent >= 70
    ? "#f59e0b" // amarelo
    : "#ef4444"; // vermelho

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
        {/* Indicador principal: Cumprimento Geral de Obrigações (%) */}
        <StatCard color={complianceColor}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>Obrigações Cumpridas no Mês</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Competência atual</div>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: complianceColor }}>
              {compliancePercent}%
            </div>
          </div>
        </StatCard>
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
            <Th onClick={() => handleSort("postedBy")}>Postado</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <Td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
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
                <Td>{o.user?.name || "N/A"}</Td>
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
                      <IconButton 
                        icon={FaTrashAlt}
                        onClick={() => handleDeleteObligation(o.id)}
                        title="Excluir"
                        variant="danger"
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
