import api from '../../../shared/services/http.js';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export function login({ email, password }) {
  return api.post(`${PREFIX}/auth/login`, { email, password });
}

export function register({ name, email, password }) {
  return api.post(`${PREFIX}/auth/register`, { name, email, password });
}

export function forgotPassword({ email }) {
  return api.post(`${PREFIX}/auth/forgot-password`, { email });
}

export function validateResetToken(token) {
  // Encode o token para garantir que caracteres especiais sejam tratados corretamente
  const encodedToken = encodeURIComponent(token);
  return api.get(`${PREFIX}/auth/validate-reset-token/${encodedToken}`);
}

export function resetPassword({ token, newPassword }) {
  return api.post(`${PREFIX}/auth/reset-password`, { token, newPassword });
}

export function me() {
  return api.get(`${PREFIX}/auth/me`);
}
