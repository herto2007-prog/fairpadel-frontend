import api from './api';
import type { Match, CargarResultadoDto } from '@/types';

class MatchesService {
  async getByTournament(tournamentId: string): Promise<Match[]> {
    const response = await api.get<Match[]>(`/matches/tournament/${tournamentId}`);
    return response.data;
  }

  async getByCategory(tournamentId: string, categoryId: string): Promise<Match[]> {
    const response = await api.get<Match[]>(`/matches/tournament/${tournamentId}/category/${categoryId}`);
    return response.data;
  }

  async getById(id: string): Promise<Match> {
    const response = await api.get<Match>(`/matches/${id}`);
    return response.data;
  }

  async cargarResultado(matchId: string, data: CargarResultadoDto): Promise<Match> {
    const response = await api.patch<Match>(`/matches/${matchId}/resultado`, data);
    return response.data;
  }

  async generarFixture(tournamentId: string, categoryId: string): Promise<Match[]> {
    const response = await api.post<Match[]>(`/matches/fixture`, {
      tournamentId,
      categoryId,
    });
    return response.data;
  }

  async programarPartido(matchId: string, data: {
    fechaProgramada: string;
    horaProgramada: string;
    canchaId?: string;
  }): Promise<Match> {
    const response = await api.patch<Match>(`/matches/${matchId}/programar`, data);
    return response.data;
  }

  async getMyMatches(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches/my');
    return response.data;
  }

  async getUpcoming(limit?: number): Promise<Match[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get<Match[]>(`/matches/upcoming${params}`);
    return response.data;
  }
}

export const matchesService = new MatchesService();
export default matchesService;
