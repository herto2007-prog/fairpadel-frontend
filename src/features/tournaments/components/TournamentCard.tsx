import { Link } from 'react-router-dom';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import type { Tournament } from '@/types';
import { TournamentStatus } from '@/types';
import { Calendar, MapPin, DollarSign } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const getStatusBadge = (status: TournamentStatus) => {
    const variants: Record<TournamentStatus, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      [TournamentStatus.BORRADOR]: { variant: 'default', label: 'Borrador' },
      [TournamentStatus.PENDIENTE_APROBACION]: { variant: 'warning', label: 'Pendiente' },
      [TournamentStatus.PUBLICADO]: { variant: 'success', label: 'Inscripciones Abiertas' },
      [TournamentStatus.EN_CURSO]: { variant: 'info', label: 'En Curso' },
      [TournamentStatus.FINALIZADO]: { variant: 'default', label: 'Finalizado' },
      [TournamentStatus.RECHAZADO]: { variant: 'danger', label: 'Rechazado' },
      [TournamentStatus.CANCELADO]: { variant: 'danger', label: 'Cancelado' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PY').format(price);
  };

  // Obtener nombres de categorías
  const getCategoryNames = () => {
    if (!tournament.categorias) return [];
    return tournament.categorias.map(tc => tc.category?.nombre || tc.nombre || 'Sin nombre');
  };

  const categoryNames = getCategoryNames();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {tournament.flyerUrl && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={tournament.flyerUrl}
            alt={tournament.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge(tournament.estado)}
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{tournament.nombre}</h3>
        
        <div className="space-y-2 text-sm text-light-secondary mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(tournament.fechaInicio)} - {formatDate(tournament.fechaFin)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{tournament.ciudad}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Gs. {formatPrice(tournament.costoInscripcion)}</span>
          </div>
        </div>

        {categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {categoryNames.slice(0, 3).map((name, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {name}
              </Badge>
            ))}
            {categoryNames.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{categoryNames.length - 3}
              </Badge>
            )}
          </div>
        )}

        <Link to={`/tournaments/${tournament.id}`}>
          <Button variant="outline" className="w-full">
            Ver Detalles
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default TournamentCard;