import axios from 'axios';

// Orden de prioridad:
// 1. Variable de entorno (VITE_API_URL)
// 2. Dominio custom de producción
// 3. Fallback a Railway
const API_URL = import.meta.env.VITE_API_URL || 
                'https://api.fairpadel.com/api' || 
                'https://confident-ambition-production.up.railway.app/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fairpadel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores 401 (token expirado o inválido)
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      // Token expirado o inválido
      localStorage.removeItem('fairpadel_token');
      localStorage.removeItem('fairpadel_user');
      // Redirigir a login con replace para evitar pantalla en negro
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);
