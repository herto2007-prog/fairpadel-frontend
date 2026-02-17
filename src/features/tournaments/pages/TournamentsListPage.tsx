import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentsService } from '@/services/tournamentsService';
import { Loading, Card, CardContent, Button } from '@/components/ui';
import { TournamentCard } from '../components/TournamentCard';
import { TournamentFilters } from '../components/TournamentFilters';
import { useAuthStore } from '@/store/authStore';
import type { Tournament, TournamentFilters as Filters } from '@/types';
import { TournamentStatus } from '@/types';
import { Plus, Zap, CalendarDays, Trophy, ChevronDown } from 'lucide-react';
import BannerZone from '@/components/BannerZone';

// ─── Section helper ───────────────────────────────────────

function TournamentSection({
  title,
  icon,
  tournaments,
  accentColor,
  collapsible = false,
  defaultCount = 6,
}: {
  title: string;
  icon: React.ReactNode;
  tournaments: Tournament[];
  accentColor: string;
  collapsible?: boolean;
  defaultCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (tournaments.length === 0) return null;

  const visible = collapsible && !expanded
    ? tournaments.slice(0, defaultCount)
    : tournaments;
  const hasMore = collapsible && tournaments.length > defaultCount;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${accentColor}`}>
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-light-text">{title}</h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-dark-surface text-light-secondary">
          {tournaments.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      {hasMore && !expanded && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Ver todos ({tournaments.length})
          </Button>
        </div>
      )}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────

const TournamentsListPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();
  const canCreate = hasRole('admin') || hasRole('organizador');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    loadTournaments();
  }, [filters]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const data = await tournamentsService.getAll(filters);
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  // Group & sort tournaments client-side
  const { enCurso, proximos, finalizados } = useMemo(() => {
    const enCurso = tournaments
      .filter((t) => t.estado === TournamentStatus.EN_CURSO)
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());

    const proximos = tournaments
      .filter((t) => t.estado === TournamentStatus.PUBLICADO)
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());

    const finalizados = tournaments
      .filter((t) => t.estado === TournamentStatus.FINALIZADO)
      .sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime());

    return { enCurso, proximos, finalizados };
  }, [tournaments]);

  const totalVisible = enCurso.length + proximos.length + finalizados.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-light-text">Torneos</h1>
          <p className="text-sm sm:text-base text-light-secondary mt-1 sm:mt-2">
            Encuentra y participa en los mejores torneos
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/tournaments/create')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm sm:text-base flex-shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Crear Torneo</span>
            <span className="sm:hidden">Crear</span>
          </button>
        )}
      </div>

      <TournamentFilters filters={filters} onChange={handleFiltersChange} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Cargando torneos..." />
        </div>
      ) : totalVisible === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🎾</div>
            <h3 className="text-xl font-semibold mb-2">No hay torneos disponibles</h3>
            <p className="text-light-secondary">
              No se encontraron torneos con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* En Curso */}
          <TournamentSection
            title="En Curso"
            icon={<Zap className="w-4 h-4 text-orange-400" />}
            accentColor="bg-orange-500/20"
            tournaments={enCurso}
          />

          {/* Banner between sections */}
          {enCurso.length > 0 && proximos.length > 0 && (
            <BannerZone zona="ENTRE_TORNEOS" layout="single" />
          )}

          {/* Proximos */}
          <TournamentSection
            title="Próximos Torneos"
            icon={<CalendarDays className="w-4 h-4 text-green-400" />}
            accentColor="bg-green-500/20"
            tournaments={proximos}
          />

          {/* Banner between sections */}
          {proximos.length > 0 && finalizados.length > 0 && (
            <BannerZone zona="ENTRE_TORNEOS" layout="single" />
          )}

          {/* Finalizados */}
          <TournamentSection
            title="Finalizados"
            icon={<Trophy className="w-4 h-4 text-light-secondary" />}
            accentColor="bg-dark-surface"
            tournaments={finalizados}
            collapsible
            defaultCount={6}
          />
        </div>
      )}
    </div>
  );
};

export default TournamentsListPage;
