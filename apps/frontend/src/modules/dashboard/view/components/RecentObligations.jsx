import { useEffect, useState } from "react";
import http from "../../../shared/services/http";

export default function RecentObligations() {
  const [obligations, setObligations] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    loadObligations();
  }, []);

  const loadObligations = async () => {
    try {
      const res = await http.get("/api/obligations");
      setObligations(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar obrigações:", err);
    }
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const filtered = obligations.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.companyName?.toLowerCase().includes(term) ||
      o.docType?.toLowerCase().includes(term) ||
      o.competence?.toLowerCase().includes(term)
    );
  });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ background: "#fff", borderRadius: "8px", padding: "20px" }}>
      <h2 style={{ marginBottom: "15px" }}>Obrigações Recentes</h2>

      {/* Campo de pesquisa */}
      <input
        type="text"
        placeholder="Pesquisar por empresa, tipo ou competência..."
        value={search}
        onChange={handleSearch}
        style={{
          marginBottom: "15px",
          padding: "8px",
          width: "100%",
          borderRadius: "6px",
          border: "1px solid #ddd",
        }}
      />

      {/* Tabela */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {[
              { key: "uploadDate", label: "Data Upload" },
              { key: "companyCode", label: "Empresa" },
              { key: "docType", label: "Tipo" },
              { key: "competence", label: "Competência" },
              { key: "dueDate", label: "Vencimento" },
              { key: "amount", label: "Valor" },
            ].map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                style={{
                  textAlign: "left",
                  padding: "10px",
                  borderBottom: "2px solid #eee",
                  cursor: "pointer",
                }}
              >
                {col.label}{" "}
                {sortConfig.key === col.key &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
            ))}
            <th style={{ padding: "10px", borderBottom: "2px solid #eee" }}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => (
            <tr key={o.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "10px" }}>{o.uploadDate}</td>
              <td style={{ padding: "10px" }}>{o.companyCode}</td>
              <td style={{ padding: "10px" }}>{o.docType}</td>
              <td style={{ padding: "10px" }}>{o.competence}</td>
              <td style={{ padding: "10px" }}>{o.dueDate}</td>
              <td style={{ padding: "10px" }}>
                {o.amount
                  ? o.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "-"}
              </td>
              <td style={{ padding: "10px" }}>
                <button style={{ marginRight: "6px" }}>Visualizar</button>
                <button style={{ marginRight: "6px" }}>Download</button>
                <button style={{ color: "red" }}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
