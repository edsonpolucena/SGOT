import { useState } from "react";
import http from "../../../shared/services/http"; // seu axios configurado

export function useCompanyController() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function createCompany(data) {
    try {
      setLoading(true);
      const res = await http.post("/api/empresas", data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || "Erro ao salvar empresa");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function getCompanies() {
    try {
      setLoading(true);
      const res = await http.get("/api/empresas");
      return res.data;
    } catch (err) {
      setError(err.response?.data || "Erro ao carregar empresas");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateCompany(id, data) {
    try {
      setLoading(true);
      const res = await http.put(`/api/empresas/${id}`, data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || "Erro ao atualizar empresa");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function getCompanyById(id) {
    try {
      setLoading(true);
      const res = await http.get(`/api/empresas/${id}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data || "Erro ao carregar empresa");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { createCompany, getCompanies, updateCompany, getCompanyById, loading, error };
}
