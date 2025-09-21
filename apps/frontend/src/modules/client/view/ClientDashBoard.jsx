import { useEffect, useState } from "react";
import styled from "styled-components";
import { useAuth } from "../../../shared/context/AuthContext";
import http from "../../../shared/services/http";
import WelcomeCard from "../../../shared/ui/WelcomeCard"; 
import {
  Wrapper,
  Header,
  CompanyInfo,
  LogoutBtn,
  Dashboard,
  Card,
  Calendar,
} from '../styles/ClientDashboard.styles.js';

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

export default function ClientDashboard() {
  const { user } = useAuth();
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <Header>
          <CompanyInfo>
            <h2>{user?.company?.nome}</h2>
            <p>CNPJ: {user?.company?.cnpj} | Código: {user?.company?.codigo}</p>
          </CompanyInfo>
              <div>
            <LogoutBtn>Sair</LogoutBtn>
                </div>
        </Header>

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
