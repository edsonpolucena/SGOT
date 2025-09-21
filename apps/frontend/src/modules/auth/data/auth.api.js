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

export function me() {
  return api.get(`${PREFIX}/auth/me`);
}
