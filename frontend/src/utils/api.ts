import axios from "axios";
import { clearStoredAuth, getStoredAuth } from "./authStorage";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api", // Default to local Next.js proxy or backend
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const { token } = getStoredAuth();
  if (!token) return config;
  const hasAuthHeader = Boolean(config.headers?.Authorization);
  if (!hasAuthHeader) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }
    const status = error?.response?.status;
    if (status === 401) {
      const { token } = getStoredAuth();
      if (token) {
        clearStoredAuth();
        const path = window.location.pathname;
        const isProtectedPath =
          /^\/(threads|premium|admin)(\/|$)/.test(path) ||
          path === "/wallet" ||
          /^\/users\/[^/]+\/wallet(\/|$)/.test(path) ||
          path === "/marketplace/wallet";
        const isAuthPage = /^\/(login|signup|verify)(\/|$)/.test(path);
        if (isProtectedPath && !isAuthPage) {
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
