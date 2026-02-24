import api from './api';
import type { MovimientoFinanciero, AuspicianteEspecie } from '@/types';

export interface CreateMovimientoDto {
  tipo: 'INGRESO' | 'EGRESO';
  categoria: string;
  concepto: string;
  monto: number;
  fecha?: string;
  observaciones?: string;
}

export interface CreateAuspicianteEspecieDto {
  sponsorId?: string;
  nombre: string;
  descripcion: string;
  valorEstimado: number;
  fecha?: string;
  observaciones?: string;
}

export const finanzasService = {
  // Movimientos Financieros
  async getMovimientos(tournamentId: string): Promise<MovimientoFinanciero[]> {
    const { data } = await api.get(`/tournaments/${tournamentId}/movimientos`);
    return data;
  },

  async createMovimiento(tournamentId: string, dto: CreateMovimientoDto): Promise<MovimientoFinanciero> {
    const { data } = await api.post(`/tournaments/${tournamentId}/movimientos`, dto);
    return data;
  },

  async updateMovimiento(tournamentId: string, movimientoId: string, dto: Partial<CreateMovimientoDto>): Promise<MovimientoFinanciero> {
    const { data } = await api.patch(`/tournaments/${tournamentId}/movimientos/${movimientoId}`, dto);
    return data;
  },

  async deleteMovimiento(tournamentId: string, movimientoId: string): Promise<void> {
    await api.delete(`/tournaments/${tournamentId}/movimientos/${movimientoId}`);
  },

  // Auspiciantes en Especie
  async getAuspiciantesEspecie(tournamentId: string): Promise<AuspicianteEspecie[]> {
    const { data } = await api.get(`/tournaments/${tournamentId}/auspiciantes-especie`);
    return data;
  },

  async createAuspicianteEspecie(tournamentId: string, dto: CreateAuspicianteEspecieDto): Promise<AuspicianteEspecie> {
    const { data } = await api.post(`/tournaments/${tournamentId}/auspiciantes-especie`, dto);
    return data;
  },

  async updateAuspicianteEspecie(tournamentId: string, auspicioId: string, dto: Partial<CreateAuspicianteEspecieDto>): Promise<AuspicianteEspecie> {
    const { data } = await api.patch(`/tournaments/${tournamentId}/auspiciantes-especie/${auspicioId}`, dto);
    return data;
  },

  async deleteAuspicianteEspecie(tournamentId: string, auspicioId: string): Promise<void> {
    await api.delete(`/tournaments/${tournamentId}/auspiciantes-especie/${auspicioId}`);
  },
};
