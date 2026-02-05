import api from './api';
import type { 
  LoginDto, 
  RegisterDto, 
  AuthResponse, 
  VerifyEmailDto, 
  ForgotPasswordDto,
  ResetPasswordDto,
  User 
} from '@/types';

class AuthService {
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async verifyEmail(data: VerifyEmailDto): Promise<{ message: string }> {
    const response = await api.post('/auth/verify-email', data);
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  }

  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();
export default authService;
