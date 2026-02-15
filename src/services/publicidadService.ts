import api from './api';

export interface Banner {
  id: string;
  titulo: string;
  imagenUrl: string;
  imagenPublicId?: string;
  linkUrl?: string;
  zona: string;
  activo: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  orden: number;
  clicks: number;
  impresiones: number;
  anunciante?: string;
  torneoId?: string;
  torneo?: { id: string; nombre: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerPublico {
  id: string;
  titulo: string;
  imagenUrl: string;
  linkUrl?: string;
  zona: string;
  anunciante?: string;
}

export interface BannerStats {
  totalBanners: number;
  bannersActivos: number;
  totalClicks: number;
  totalImpresiones: number;
  ctr: string;
  banners: {
    id: string;
    titulo: string;
    zona: string;
    activo: boolean;
    clicks: number;
    impresiones: number;
    ctr: string;
    torneoNombre?: string | null;
  }[];
}

class PublicidadService {
  // Admin CRUD
  async listarBanners(): Promise<Banner[]> {
    const response = await api.get<Banner[]>('/publicidad/banners');
    return response.data;
  }

  async crearBanner(formData: FormData): Promise<Banner> {
    const response = await api.post<Banner>('/publicidad/banners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async actualizarBanner(id: string, formData: FormData): Promise<Banner> {
    const response = await api.put<Banner>(`/publicidad/banners/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async eliminarBanner(id: string): Promise<void> {
    await api.delete(`/publicidad/banners/${id}`);
  }

  async toggleActivo(id: string): Promise<Banner> {
    const response = await api.put<Banner>(`/publicidad/banners/${id}/toggle`);
    return response.data;
  }

  async obtenerEstadisticas(): Promise<BannerStats> {
    const response = await api.get<BannerStats>('/publicidad/banners/stats');
    return response.data;
  }

  // Público
  async obtenerBannersActivos(zona: string, torneoId?: string): Promise<BannerPublico[]> {
    const params = torneoId ? { torneoId } : {};
    const response = await api.get<BannerPublico[]>(`/publicidad/activos/${zona}`, { params });
    return response.data;
  }

  async registrarClick(id: string): Promise<void> {
    await api.post(`/publicidad/click/${id}`);
  }

  async registrarImpresion(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await api.post('/publicidad/impresion', { ids });
  }
}

export const publicidadService = new PublicidadService();
export default publicidadService;
