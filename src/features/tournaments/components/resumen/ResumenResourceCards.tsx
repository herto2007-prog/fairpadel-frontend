import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Tournament, TournamentCategory, TorneoPelotasRonda } from '@/types';
import { Clock, CircleDot, DollarSign } from 'lucide-react';

interface TournamentStats {
  inscripcionesTotal: number;
  partidosTotal: number;
  canchasConfiguradas: number;
  categorias: (TournamentCategory & { inscripcionesCount: number })[];
}

interface ResumenResourceCardsProps {
  tournament: Tournament;
  stats: TournamentStats | null;
  pelotasConfig: TorneoPelotasRonda[];
  loading: boolean;
}

export function ResumenResourceCards({ tournament, stats, pelotasConfig, loading }: ResumenResourceCardsProps) {
  const totalParejas = stats?.inscripcionesTotal || 0;
  const totalPartidosEstimado = totalParejas > 0 ? totalParejas - 1 : 0;
  const duracionPartidoMin = tournament.minutosPorPartido || 60;
  const canchasDisponibles = stats?.canchasConfiguradas || 1;
  const horasNecesarias = canchasDisponibles > 0
    ? Math.ceil((totalPartidosEstimado * duracionPartidoMin) / (60 * canchasDisponibles))
    : 0;

  // Pelotas calculation — matches current DashboardPremiumTab logic
  const pelotasPorDefecto = 2;
  const pelotasNecesarias = pelotasConfig.length > 0
    ? pelotasConfig.reduce((acc, r) => {
        const partidosRonda =
          r.ronda === 'final' ? 1
          : r.ronda === 'semis' ? 2
          : r.ronda === 'cuartos' ? 4
          : r.ronda === 'octavos' ? 8
          : Math.ceil(totalPartidosEstimado / 7);
        return acc + (partidosRonda * r.cantidadPelotas);
      }, 0)
    : totalPartidosEstimado * pelotasPorDefecto;

  const costoPelotas = pelotasNecesarias * 15000;

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 border-l-4 border-l-dark-border animate-pulse">
            <div className="h-10 bg-dark-surface rounded mb-2" />
            <div className="h-4 w-24 bg-dark-surface rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Horas Estimadas */}
      <Card className="p-5 border-l-4 border-l-blue-500">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold">{horasNecesarias}h</p>
            <p className="text-sm text-light-secondary">Horas estimadas</p>
          </div>
        </div>
        <p className="text-xs text-light-muted mt-2">
          {canchasDisponibles} cancha{canchasDisponibles !== 1 ? 's' : ''} x {duracionPartidoMin}min/partido
        </p>
      </Card>

      {/* Pelotas Necesarias */}
      <Card className="p-5 border-l-4 border-l-amber-500">
        <div className="flex items-center gap-3">
          <CircleDot className="w-8 h-8 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold">{pelotasNecesarias}</p>
            <p className="text-sm text-light-secondary">Pelotas necesarias</p>
          </div>
        </div>
        <p className="text-xs text-light-muted mt-2">
          {pelotasConfig.length > 0 ? 'Basado en config. por ronda' : `${pelotasPorDefecto} pelotas/partido (default)`}
        </p>
      </Card>

      {/* Costo Pelotas */}
      <Card className="p-5 border-l-4 border-l-emerald-500">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold">{formatCurrency(costoPelotas)}</p>
            <p className="text-sm text-light-secondary">Costo pelotas (est.)</p>
          </div>
        </div>
        <p className="text-xs text-light-muted mt-2">
          {pelotasNecesarias} x Gs. 15.000
        </p>
      </Card>
    </div>
  );
}
