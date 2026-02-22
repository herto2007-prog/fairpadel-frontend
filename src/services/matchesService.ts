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

  async cargarResultado(matchId: string, data: CargarResultadoDto): Promise<Match & { categoriaCompleta?: boolean }> {
    const response = await api.put<Match & { categoriaCompleta?: boolean }>(`/matches/${matchId}/cargar-resultado`, data);
    return response.data;
  }

  async editarResultado(matchId: string, data: CargarResultadoDto): Promise<Match & { categoriaCompleta?: boolean }> {
    const response = await api.put<Match & { categoriaCompleta?: boolean }>(`/matches/${matchId}/editar-resultado`, data);
    return response.data;
  }

  async sortearCategoria(tournamentId: string, categoryId: string, fechaInicio?: string): Promise<any> {
    const response = await api.post(
      `/matches/torneo/${tournamentId}/categoria/${categoryId}/sortear`,
      fechaInicio ? { fechaInicio } : {},
    );
    return response.data;
  }

  async generarFixtureCompleto(tournamentId: string): Promise<any> {
    const response = await api.post(`/matches/torneo/${tournamentId}/generar-fixture`);
    return response.data;
  }

  async obtenerFixture(tournamentId: string, categoryId?: string): Promise<any> {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    const response = await api.get(`/matches/torneo/${tournamentId}/fixture${params}`);
    return response.data;
  }

  // Internal fixture (includes draft/borrador) — for organizers/admin
  async obtenerFixtureInterno(tournamentId: string, categoryId?: string): Promise<any> {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    const response = await api.get(`/matches/torneo/${tournamentId}/fixture-interno${params}`);
    return response.data;
  }

  async publicarFixture(tournamentId: string, categoryId: string): Promise<any> {
    const response = await api.post(
      `/matches/torneo/${tournamentId}/categoria/${categoryId}/publicar-fixture`,
    );
    return response.data;
  }

  async swapMatchSchedules(match1Id: string, match2Id: string): Promise<any> {
    const response = await api.post('/matches/swap-schedules', {
      match1Id,
      match2Id,
    });
    return response.data;
  }

  async reprogramarPartido(matchId: string, data: {
    fechaProgramada: string;
    horaProgramada: string;
    torneoCanchaId?: string;
  }): Promise<Match> {
    const response = await api.put<Match>(`/matches/${matchId}/reprogramar`, data);
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

  async obtenerStandings(tournamentId: string, categoryId: string): Promise<any> {
    const response = await api.get(
      `/matches/torneo/${tournamentId}/categoria/${categoryId}/standings`,
    );
    return response.data;
  }

  async finalizarCategoria(tournamentId: string, categoryId: string): Promise<any> {
    const response = await api.post(
      `/matches/torneo/${tournamentId}/categoria/${categoryId}/finalizar`,
    );
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
