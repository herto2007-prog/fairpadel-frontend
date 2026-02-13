import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { circuitosService } from '@/services/circuitosService';
import { Loading, Card, CardContent, Badge } from '@/components/ui';
import { Trophy, Calendar, MapPin } from 'lucide-react';
import type { Circuito } from '@/types';
import { CircuitoEstado } from '@/types';
import { formatShortDate } from '@/lib/utils';

const getEstadoBadgeVariant = (estado: CircuitoEstado) => {
  switch (estado) {
    case CircuitoEstado.ACTIVO:
      return 'success' as const;
    case CircuitoEstado.FINALIZADO:
      return 'info' as const;
    case CircuitoEstado.CANCELADO:
      return 'danger' as const;
    default:
      return 'default' as const;
  }
};

const CircuitosListPage = () => {
  const [circuitos, setCircuitos] = useState<Circuito[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircuitos();
  }, []);

  const loadCircuitos = async () => {
    setLoading(true);
    try {
      const data = await circuitosService.getAll();
      setCircuitos(data);
    } catch (error) {
      console.error('Error loading circuitos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando circuitos..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-light-text flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary-400" />
          Circuitos
        </h1>
        <p className="text-light-secondary mt-2">
          Descubre los circuitos de torneos de padel activos y compite por los mejores puestos
        </p>
      </div>

      {circuitos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-light-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-light-text mb-2">
              No hay circuitos disponibles
            </h3>
            <p className="text-light-secondary">
              Aun no se han creado circuitos. Vuelve pronto para ver los nuevos circuitos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circuitos.map((circuito) => (
            <Link
              key={circuito.id}
              to={`/circuitos/${circuito.id}`}
              className="block group"
            >
              <Card className="h-full transition-all duration-200 hover:border-primary-500/50 hover:bg-dark-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-light-text truncate group-hover:text-primary-400 transition-colors">
                        {circuito.nombre}
                      </h3>
                      <p className="text-sm text-primary-400 font-medium mt-1">
                        {circuito.temporada}
                      </p>
                    </div>
                    <Badge variant={getEstadoBadgeVariant(circuito.estado)}>
                      {circuito.estado}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-light-secondary">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {circuito.ciudad
                          ? `${circuito.ciudad}, ${circuito.pais}`
                          : circuito.pais}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-light-secondary">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {formatShortDate(circuito.fechaInicio)} - {formatShortDate(circuito.fechaFin)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-light-secondary">
                      <Trophy className="h-4 w-4 shrink-0" />
                      <span>
                        {circuito._count?.torneos ?? circuito.torneos?.length ?? 0}{' '}
                        {(circuito._count?.torneos ?? circuito.torneos?.length ?? 0) === 1
                          ? 'torneo'
                          : 'torneos'}
                      </span>
                    </div>
                  </div>

                  {circuito.descripcion && (
                    <p className="mt-4 text-sm text-light-secondary line-clamp-2">
                      {circuito.descripcion}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CircuitosListPage;
