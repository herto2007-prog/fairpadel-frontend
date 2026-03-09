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

export interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
  direccion?: string;
  mapsUrl?: string;
  telefono?: string;
  activa: boolean;
  canchas: {
    id: string;
    nombre: string;
    tipo: string;
    tieneLuz: boolean;
    activa: boolean;
  }[];
  _count?: {
    canchas: number;
    torneosPrincipal: number;
  };
}

export interface CreateSedeData {
  nombre: string;
  ciudad: string;
  direccion?: string;
  mapsUrl?: string;
  telefono?: string;
}

export interface UpdateSedeData extends Partial<CreateSedeData> {
  activa?: boolean;
}

export const adminService = {
  // USUARIOS
  getUsers: () => api.get('/admin/users').then(r => r.data),
  updateUserRoles: (data: UpdateRolesData) => 
    api.post('/admin/users/update-roles', data).then(r => r.data),
  getStats: () => api.get('/admin/stats').then(r => r.data),
  
  // SEDES
  getSedes: () => api.get('/admin/sedes').then(r => r.data),
  getSede: (id: string) => api.get(`/admin/sedes/${id}`).then(r => r.data),
  createSede: (data: CreateSedeData) => api.post('/admin/sedes', data).then(r => r.data),
  updateSede: (id: string, data: UpdateSedeData) => api.put(`/admin/sedes/${id}`, data).then(r => r.data),
  deleteSede: (id: string) => api.delete(`/admin/sedes/${id}`).then(r => r.data),
  activateSede: (id: string) => api.put(`/admin/sedes/${id}/activate`, {}).then(r => r.data),
};
