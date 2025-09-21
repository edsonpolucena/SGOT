import { createContext, useContext, useEffect, useState } from 'react';
import http from '../services/http.js';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('token') || sessionStorage.getItem('token')
  );

  useEffect(() => {
    if (!token) { setUser(null); return; }
    let canceled = false;
    http.get(`${PREFIX}/auth/me`)
      .then(res => { if (!canceled) setUser(res.data); })
      .catch(() => { if (!canceled) logout(); });
    return () => { canceled = true; };
  }, [token]);

  async function login({ email, password, remember = true }) {
    const { data } = await http.post(`${PREFIX}/auth/login`, { email, password });
    (remember ? localStorage : sessionStorage).setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(form) {
    const { data } = await http.post(`${PREFIX}/auth/register`, form);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      setUser,
      isAccounting: user?.role === 'ACCOUNTING',
      isClient: user?.role === 'CLIENT'
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
