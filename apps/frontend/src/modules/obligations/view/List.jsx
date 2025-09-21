

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../../shared/ui/Header.jsx';
import * as api from '../data/obligation.api.js';

const parseNotes = (notes) => {
  try { return JSON.parse(notes || '{}'); } catch { return {}; }
};

export default function List() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setLoading(true);
      const r = await api.list(); // GET
      setItems(r.data);
      setErr('');
    } catch {
      setErr('Falha ao carregar obrigações');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id) {
    if (!confirm('Excluir esta obrigação?')) return;
    try {
      await api.remove_(id);   // DELETE
      setItems(prev => prev.filter(x => x.id !== id));
    } catch {
      alert('Falha ao excluir');
    }
  }

  return (
    <div className="container">
      <Header />
      <div className="card">
        <div style={{display:'flex', alignItems:'center', marginBottom:12}}>
          <h2 style={{margin:0}}>Obrigações</h2>
          <div className="spacer" />
          <Link className="btn" to="/obligations/new">+ Nova obrigação</Link>
        </div>

        {loading && <p>Carregando…</p>}
        {err && <p style={{color:'#f16a6a'}}>{err}</p>}

        {!loading && !err && (
          items.length === 0 ? <p>Nenhum registro.</p> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Tipo</th>
                  <th>Competência</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th style={{width:160}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(o => {
                  const meta = parseNotes(o.notes);
                  return (
                    <tr key={o.id}>
                      <td>{meta.companyName || '—'}<br/><small style={{opacity:.7}}>{meta.cnpj || ''}</small></td>
                      <td>{meta.docType || o.title?.split(' ')?.[0] || '—'}</td>
                      <td>{meta.competence || '—'}</td>
                      <td>{new Date(o.dueDate).toLocaleDateString()}</td>
                      <td>{o.amount != null ? Number(o.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</td>
                      <td><span className={`badge ${o.status==='LATE'?'late':'ok'}`}>{o.status}</span></td>
                      <td style={{display:'flex', gap:8}}>
                        <Link className="btn secondary" to={`/obligations/${o.id}/edit`}>Editar</Link>
                        <button className="btn danger" onClick={() => onDelete(o.id)}>Excluir</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
