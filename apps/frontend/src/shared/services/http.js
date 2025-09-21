
import axios from "axios";

const base = (import.meta.env.VITE_API_URL || "http://localhost:3333").replace(/\/+$/, "");
const api = axios.create({ baseURL: base });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (t) {
    c.headers = c.headers || {};
    c.headers.Authorization = `Bearer ${t}`;
  }
  return c;
});

export default api;
export { api };
export const http = api;