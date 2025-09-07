import { useEffect, useState } from "react";
import { api } from "../api"; // se não tiver este arquivo, veja observação abaixo

type Obligation = {
  id: string;
  title: string;
  taxpayerName: string;
  dueDate: string;
  status: string;
};

export default function Obligations() {
  const [items, setItems] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Obligation[]>("/api/obligations")
      .then((r) => setItems(r.data))
      .catch((e) => setError(e?.message ?? "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, []);

  async function addDummy() {
    try {
      setLoading(true);
      const r = await api.post<Obligation>("/api/obligations", {
        title: "Obrigação de teste",
        dueDate: new Date().toISOString(),
        taxpayerName: "Empresa Exemplo LTDA",
      });
      setItems((prev) => [r.data, ...prev]);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao criar");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Carregando…</div>;
  if (error) return <div style={{ padding: 16, color: "crimson" }}>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Obrigações</h1>
      <button onClick={addDummy} style={{ marginBottom: 12 }}>
        + Adicionar teste
      </button>

      {items.length === 0 ? (
        <p>Nenhum registro.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((o) => (
            <li
              key={o.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 600 }}>{o.title}</div>
              <div style={{ opacity: 0.8, fontSize: 14 }}>
                {o.taxpayerName} • vence em{" "}
                {new Date(o.dueDate).toLocaleDateString()}
              </div>
              <div style={{ textTransform: "uppercase", fontSize: 12, opacity: 0.6 }}>
                {o.status}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
