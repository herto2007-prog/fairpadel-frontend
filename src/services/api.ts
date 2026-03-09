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
