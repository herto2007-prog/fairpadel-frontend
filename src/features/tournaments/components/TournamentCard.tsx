import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Tournament } from '../../../services/tournamentService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'PUBLICADO':
        return 'badge-primary';
      case 'EN_CURSO':
        return 'badge-success';
      case 'FINALIZADO':
        return 'bg-gray-600/20 text-gray-300 border border-gray-600/30';
      default:
        return 'badge-warning';
    }
  };

  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case 'BORRADOR':
        return 'Borrador';
      case 'PENDIENTE_APROBACION':
        return 'Pendiente';
      case 'PUBLICADO':
        return 'Inscripciones Abiertas';
      case 'EN_CURSO':
        return 'En Curso';
      case 'FINALIZADO':
        return 'Finalizado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  };

  return (
    <Link to={`/tournaments/${tournament.id}`}>
      <Card className="hover:border-primary-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-600/10 group cursor-pointer overflow-hidden">
        {/* Banner/Imagen */}
        <div className="h-32 bg-gradient-to-r from-primary-600/20 to-primary-800/20 relative overflow-hidden">
          {tournament.flyerUrl ? (
            <img
              src={tournament.flyerUrl}
              alt={tournament.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-primary-600/30" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`badge ${getStatusColor(tournament.estado)}`}>
              {getStatusLabel(tournament.estado)}
            </span>
          </div>
        </div>

        <CardContent className="p-5">
          <h3 className="font-display font-bold text-lg text-white mb-2 group-hover:text-primary-400 transition-colors line-clamp-1">
            {tournament.nombre}
          </h3>

          {tournament.descripcion && (
            <p className="text-dark-400 text-sm mb-4 line-clamp-2">
              {tournament.descripcion}
            </p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-dark-400">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span>
                {format(new Date(tournament.fechaInicio), 'dd MMM yyyy', { locale: es })}
                {' - '}
                {format(new Date(tournament.fechaFin), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-dark-400">
              <Users className="w-4 h-4 text-primary-500" />
              <span>{tournament.categories?.length || 0} categorías</span>
            </div>
          </div>

          {tournament.premio && (
            <div className="mt-4 pt-4 border-t border-dark-800">
              <span className="text-primary-400 font-semibold">
                Premio: {tournament.premio}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
