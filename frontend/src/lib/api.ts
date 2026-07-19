import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor: attach token synchronously from localStorage (no async hangs)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 globally (except for auth check routes)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
  window.dispatchEvent(new Event('local-auth-changed'));
};

export const clearToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_phone');
  window.dispatchEvent(new Event('local-auth-changed'));
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};
