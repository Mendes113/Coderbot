
import axios from 'axios';
import { pb } from "@/integrations/pocketbase/client";
import posthog from 'posthog-js';

const base = (import.meta as any)?.env?.VITE_API_URL || '/api';
const api = axios.create({ baseURL: base });

api.interceptors.request.use(async (config) => {
  // Use PocketBase token instead of Supabase
  if (pb.authStore.isValid) {
    config.headers.Authorization = `Bearer ${pb.authStore.token}`;
  }
  // Mark start time for latency measurement (non-enumerable)
  (config as any)._startTs = Date.now();
  return config;
});

api.interceptors.response.use(
  (response) => {
    try {
      const cfg: any = response.config || {};
      const started = cfg._startTs ? Number(cfg._startTs) : undefined;
      if (started) {
        const durationMs = Date.now() - started;
        const url = (cfg.url || '').toString();
        const method = (cfg.method || 'get').toUpperCase();
        // Send privacy-safe analytics
        posthog?.capture?.('edu_api_latency', {
          method,
          path: url.replace(/^https?:\/\/[^/]+/i, ''),
          status: response.status,
          durationMs,
        });
      }
    } catch { /* no-op */ }
    return response;
  },
  (error) => {
    try {
      const cfg: any = error?.config || {};
      const started = cfg._startTs ? Number(cfg._startTs) : undefined;
      if (started) {
        const durationMs = Date.now() - started;
        const url = (cfg.url || '').toString();
        const method = (cfg.method || 'get').toUpperCase();
        const status = error?.response?.status ?? 0;
        posthog?.capture?.('edu_api_latency', {
          method,
          path: url.replace(/^https?:\/\/[^/]+/i, ''),
          status,
          durationMs,
          error: true,
        });
      }
    } catch { /* no-op */ }
    return Promise.reject(error);
  }
);

export default api;
