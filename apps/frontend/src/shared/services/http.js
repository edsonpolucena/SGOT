
import axios from "axios";
import * as Sentry from "@sentry/react";

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.MODE !== 'test') {
      if (error.response) {
        const status = error.response.status;
        if (status >= 500) {
          Sentry.captureException(error, {
            tags: {
              endpoint: error.config?.url,
              method: error.config?.method,
              statusCode: status,
            },
            extra: {
              response: error.response.data,
              requestUrl: error.config?.url,
            },
          });
        }
      } else if (error.request) {
        Sentry.captureException(error, {
          tags: {
            type: 'network_error',
            endpoint: error.config?.url,
          },
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { api };
export const http = api;