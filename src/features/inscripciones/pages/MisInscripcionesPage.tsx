import { useState, useEffect } from 'react';
import { inscripcionesService } from '@/services/inscripcionesService';
import { Loading, Card, CardContent, Badge, Button } from '@/components/ui';
import type { Inscripcion } from '@/types';
import { InscripcionEstado } from '@/types';
import { Calendar, MapPin, Users } from 'lucide-react';

const MisInscripcionesPage = () => {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadInscripciones();
  }, []);

  const loadInscripciones = async () => {
    try {
      const data = await inscripcionesService.getMyInscripciones();
      setInscripciones(data);
    } catch (error) {
      console.error('Error loading inscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado: InscripcionEstado) => {
    const variants: Record<InscripcionEstado, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      [InscripcionEstado.PENDIENTE_PAGO]: { variant: 'warning', label: 'Pendiente de Pago' },
      [InscripcionEstado.PENDIENTE_CONFIRMACION]: { variant: 'info', label: 'Pendiente Confirmación' },
      [InscripcionEstado.PENDIENTE_PAGO_PRESENCIAL]: { variant: 'warning', label: 'Pago Presencial' },
      [InscripcionEstado.CONFIRMADA]: { variant: 'success', label: 'Confirmada' },
      [InscripcionEstado.RECHAZADA]: { variant: 'danger', label: 'Rechazada' },
      [InscripcionEstado.CANCELADA]: { variant: 'default', label: 'Cancelada' },
    };
    const { variant, label } = variants[estado];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredInscripciones = filter
    ? inscripciones.filter((i) => i.estado === filter)
    : inscripciones;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Cargando inscripciones..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-light-text">Mis Inscripciones</h1>
        <p className="text-light-secondary mt-2">Revisa el estado de tus inscripciones a torneos</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={filter === '' ? 'default' : 'outline'}
          onClick={() => setFilter('')}
        >
          Todas
        </Button>
        <Button
          variant={filter === InscripcionEstado.PENDIENTE_PAGO ? 'default' : 'outline'}
          onClick={() => setFilter(InscripcionEstado.PENDIENTE_PAGO)}
        >
          Pendientes
        </Button>
        <Button
          variant={filter === InscripcionEstado.CONFIRMADA ? 'default' : 'outline'}
          onClick={() => setFilter(InscripcionEstado.CONFIRMADA)}
        >
          Confirmadas
        </Button>
      </div>

      {filteredInscripciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No tienes inscripciones</h3>
            <p className="text-light-secondary">
              Explora los torneos disponibles y participa
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInscripciones.map((inscripcion) => (
            <Card key={inscripcion.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">
                        {inscripcion.tournament?.nombre || 'Torneo'}
                      </h3>
                      {getStatusBadge(inscripcion.estado)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-light-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {inscripcion.tournament?.fechaInicio 
                          ? new Date(inscripcion.tournament.fechaInicio).toLocaleDateString()
                          : 'Fecha no disponible'
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {inscripcion.tournament?.ciudad || 'Ciudad'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {inscripcion.category?.nombre || 'Categoría'}
                      </span>
                    </div>
                    {inscripcion.pareja && (
                      <div className="mt-2 text-sm">
                        <span className="text-light-secondary">Pareja: </span>
                        {inscripcion.pareja.jugador1?.nombre} {inscripcion.pareja.jugador1?.apellido} & 
                        {inscripcion.pareja.jugador2 
                          ? ` ${inscripcion.pareja.jugador2.nombre} ${inscripcion.pareja.jugador2.apellido}`
                          : ` Doc: ${inscripcion.pareja.jugador2Documento}`
                        }
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-start">
                    {inscripcion.estado === InscripcionEstado.PENDIENTE_PAGO && (
                      <Button variant="primary">
                        Pagar
                      </Button>
                    )}
                    <Button variant="outline">
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisInscripcionesPage;
