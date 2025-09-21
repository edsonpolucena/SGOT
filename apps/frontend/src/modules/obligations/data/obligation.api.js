import http from '../../../shared/services/http.js';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export function list(params) {
  return http.get(`${PREFIX}/obligations`, { params });
}
export function getById(id) {
  return http.get(`${PREFIX}/obligations/${id}`);
}
export function create(payload) {
  return http.post(`${PREFIX}/obligations`, payload);
}
export function update(id, payload) {
  return http.put(`${PREFIX}/obligations/${id}`, payload);
}
export function remove_(id) {
  return http.delete(`${PREFIX}/obligations/${id}`);
}
