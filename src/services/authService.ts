import { api } from './api';

export interface LoginData {
  documento: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    documento: string;
    estado: string;
    roles: string[];
    fotoUrl?: string;
  };
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
  consentCheckboxWhatsapp?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

const TOKEN_KEY = 'fairpadel_token';
const USER_KEY = 'fairpadel_user';

export const authService = {
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    const result = response.data as LoginResponse;
    
    // Guardar token y usuario en localStorage
    localStorage.setItem(TOKEN_KEY, result.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    
    return result;
  },
  
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', data);
    const result = response.data as LoginResponse;
    
    // NOTA: NO guardamos el token en el registro
    // El usuario debe verificar su email y luego hacer login manual
    // Solo guardamos el email para poder reenviar verificación si es necesario
    localStorage.setItem('pendingVerificationEmail', data.email);
    
    return result;
  },
  
  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  getUser: (): LoginResponse['user'] | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  
  getMe: () => api.get('/auth/me').then(r => r.data),
  
  forgotPassword: (data: ForgotPasswordData) => 
    api.post('/auth/forgot-password', data).then(r => r.data),
  
  resetPassword: (data: ResetPasswordData) => 
    api.post('/auth/reset-password', data).then(r => r.data),
  
  verifyEmail: (token: string) => 
    api.get(`/auth/verify-email?token=${token}`).then(r => r.data),
  
  resendVerification: (email: string) => 
    api.post('/auth/resend-verification', { email }).then(r => r.data),
};
