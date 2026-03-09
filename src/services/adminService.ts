import { api } from './api';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  documento: string;
  estado: string;
  roles: string[];
  categoriaActual?: {
    nombre: string;
  };
}

export interface UpdateRolesData {
  userId: string;
  roles: string[];
}

export const adminService = {
  // Obtener todos los usuarios
  getUsers: () => api.get('/admin/users').then(r => r.data),
  
  // Actualizar roles de un usuario
  updateUserRoles: (data: UpdateRolesData) => 
    api.post('/admin/users/update-roles', data).then(r => r.data),
  
  // Obtener estadísticas
  getStats: () => api.get('/admin/stats').then(r => r.data),
};
