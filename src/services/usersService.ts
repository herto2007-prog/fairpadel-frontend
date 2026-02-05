import api from './api';
import type { User, UpdateProfileDto } from '@/types';

class UsersService {
  async getById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  }

  async getByDocumento(documento: string): Promise<User> {
    const response = await api.get<User>(`/users/documento/${documento}`);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/profile');
    return response.data;
  }

  async updateMyProfile(data: UpdateProfileDto): Promise<User> {
    const response = await api.patch<User>('/users/profile', data);
    return response.data;
  }

  async updateFoto(file: File): Promise<{ fotoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<{ fotoUrl: string }>('/users/foto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async search(query: string): Promise<User[]> {
    const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
}

export const usersService = new UsersService();
export default usersService;