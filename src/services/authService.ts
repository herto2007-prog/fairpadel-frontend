import { api } from './api';

export interface LoginData {
  documento: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  fechaNacimiento: string;
  genero: 'MASCULINO' | 'FEMENINO';
  ciudad: string;
  categoria: string;
  fotoUrl?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export const authService = {
  login: (data: LoginData) => api.post('/auth/login', data).then(r => r.data),
  register: (data: RegisterData) => api.post('/auth/register', data).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
  forgotPassword: (data: ForgotPasswordData) => api.post('/auth/forgot-password', data).then(r => r.data),
  resetPassword: (data: ResetPasswordData) => api.post('/auth/reset-password', data).then(r => r.data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`).then(r => r.data),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }).then(r => r.data),
};
