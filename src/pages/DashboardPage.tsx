// ═══════════════════════════════════════════════════════
// DASHBOARD PAGE - Sistema Evolutivo por Fase
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BackgroundEffects } from '../components/ui/BackgroundEffects';
import { NovatoDashboard } from '../features/dashboard/components/NovatoDashboard';
import { ActivoDashboard } from '../features/dashboard/components/ActivoDashboard';
import { DashboardData, UserFase } from '../features/dashboard/types/dashboard.types';
import { determineUserFase } from '../features/dashboard/hooks/useUserFase';
import { perfilService } from '../features/perfil/perfilService';
import { api } from '../services/api';

// TODO: Crear estos componentes cuando se implementen las otras fases
// import { ActivoDashboard } from '../features/dashboard/components/ActivoDashboard';
// import { RegularDashboard } from '../features/dashboard/components/RegularDashboard';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [fase, setFase] = useState<UserFase>('NOVATO');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener perfil del usuario
      const perfil = await perfilService.getMiPerfil();

      // 2. Determinar fase basada principalmente en torneos jugados
      const torneosJugados = perfil.stats?.torneosJugados || 0;
      const diasDesdeRegistro = torneosJugados === 0 ? 1 : 30;
      
      const userFase = determineUserFase({
        torneosJugados,
        diasDesdeRegistro,
        seguidores: perfil.seguidores || 0,
        torneosUltimos30Dias: 0,
        esPremium: perfil.esPremium || false,
      });

      setFase(userFase);

      // 4. Cargar torneos abiertos (endpoint existente)
      const torneosResponse = await api.get('/tournaments');
      const torneosAbiertos = (torneosResponse.data?.data || [])
        .filter((t: any) => t.estado === 'ABIERTO' || t.estado === 'INSCRIPCION')
        .map((t: any) => ({
          id: t.id,
          nombre: t.nombre,
          slug: t.slug || t.id,
          flyerUrl: t.flyerUrl,
          fechaInicio: t.fechaInicio,
          fechaCierreInscripcion: t.fechaCierreInscripcion,
          ciudad: t.ciudad || 'Sin ciudad',
          sedeNombre: t.sede?.nombre || 'Sin sede',
          costoInscripcion: t.costoInscripcion || 0,
          cuposDisponibles: t.cuposDisponibles || 0,
          cuposTotales: t.cuposTotales || 0,
          categorias: t.categorias?.map((c: any) => c.nombre) || [],
          inscripcionesAbiertas: t.inscripcionesAbiertas || false,
          cierraEnHoras: t.fechaCierreInscripcion 
            ? Math.max(0, Math.floor((new Date(t.fechaCierreInscripcion).getTime() - Date.now()) / (1000 * 60 * 60)))
            : undefined,
        }));

      // 5. Construir objeto DashboardData
      const dashboardData: DashboardData = {
        perfil: {
          id: perfil.id,
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          fotoUrl: perfil.fotoUrl,
          bio: perfil.bio,
          emailVerificado: perfil.estado === 'VERIFICADO',
          categoria: perfil.categoria?.nombre,
        },
        stats: {
          torneosJugados: perfil.stats?.torneosJugados || 0,
          torneosUltimos30Dias: 0, // TODO
          diasDesdeRegistro,
          seguidores: perfil.seguidores || 0,
          perfilCompleto: !!(perfil.fotoUrl && perfil.bio && perfil.ciudad),
        },
        torneosAbiertos,
        torneosUrgentes: [], // Se filtran en el componente
        actividadRed: [], // TODO: Implementar cuando haya red social
        jugadoresSugeridos: [], // TODO
        puntosTotales: perfil.ranking?.[0]?.puntosTotales || 0,
        posicionRanking: perfil.ranking?.[0]?.posicion,
        rachaActual: perfil.partidos?.rachaActual || 0,
      };

      setData(dashboardData);
    } catch (err: any) {
      console.error('Error cargando dashboard:', err);
      setError(err.response?.data?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <BackgroundEffects variant="subtle" showGrid={false} />
        <Loader2 className="w-8 h-8 text-[#df2531] animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <BackgroundEffects variant="subtle" showGrid={false} />
        <div className="text-center">
          <p className="text-white/60 mb-4">{error || 'Error cargando dashboard'}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-[#df2531] text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Renderizar dashboard según fase
  const renderDashboard = () => {
    switch (fase) {
      case 'NOVATO':
        return <NovatoDashboard data={data} />;
      
      case 'ACTIVO':
      case 'REGULAR':
      case 'PREMIUM':
        return <ActivoDashboard data={data} />;
      
      default:
        return <NovatoDashboard data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white p-4 md:p-6 relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      <div className="max-w-6xl mx-auto relative z-10">
        {renderDashboard()}
      </div>
    </div>
  );
}
