import { useState } from 'react';
import * as auth from '../data/auth.api';

export function useAuthController() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function login({ email, password }) {
    setErr(null); setLoading(true);
    try { const { data } = await auth.login({ email, password }); return data; }
    catch (e) { setErr(e?.response?.data?.message || 'Falha no login'); throw e; }
    finally { setLoading(false); }
  }

  async function register(payload) {
    setErr(null); setLoading(true);
    try { const { data } = await auth.register(payload); return data; }
    catch (e) { setErr(e?.response?.data?.message || 'Falha ao registrar'); throw e; }
    finally { setLoading(false); }
  }

  async function forgotPassword({ email }) {
    setErr(null); setLoading(true);
    try { const { data } = await auth.forgotPassword({ email }); return data; }
    catch (e) { setErr(e?.response?.data?.message || 'Falha ao enviar recuperação'); throw e; }
    finally { setLoading(false); }
  }

  async function validateResetToken(token) {
    setErr(null);
    try { 
      const { data } = await auth.validateResetToken(token); 
      return data; 
    }
    catch (e) { 
      setErr(e?.response?.data?.reason || 'Token inválido'); 
      throw e; 
    }
  }

  async function resetPassword({ token, newPassword }) {
    setErr(null); setLoading(true);
    try { 
      const { data } = await auth.resetPassword({ token, newPassword }); 
      return data; 
    }
    catch (e) { 
      setErr(e?.response?.data?.message || 'Falha ao redefinir senha'); 
      throw e; 
    }
    finally { setLoading(false); }
  }

  return { 
    login, 
    register, 
    forgotPassword, 
    validateResetToken,
    resetPassword,
    loading, 
    err, 
    setErr 
  };
}
