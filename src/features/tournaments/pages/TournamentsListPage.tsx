import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentsService } from '@/services/tournamentsService';
import { Loading, Card, CardContent } from '@/components/ui';
import { TournamentCard } from '../components/TournamentCard';
import { TournamentFilters } from '../components/TournamentFilters';
import { useAuthStore } from '@/store/authStore';
import type { Tournament, TournamentFilters as Filters } from '@/types';
import { Plus } from 'lucide-react';
import BannerZone from '@/components/BannerZone';

const TournamentsListPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();
  const canCreate = hasRole('admin') || hasRole('organizador');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    inscripcionesAbiertas: true,
  });

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando torneos..." />
      </div>
    );
  }

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

      {tournaments.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament, index) => (
            <React.Fragment key={tournament.id}>
              <TournamentCard tournament={tournament} />
              {/* Insert banner after every 6th card */}
              {(index + 1) % 6 === 0 && (
                <div className="col-span-full">
                  <BannerZone zona="ENTRE_TORNEOS" layout="single" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentsListPage;
