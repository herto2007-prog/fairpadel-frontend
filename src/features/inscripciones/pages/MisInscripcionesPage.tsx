import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Calendar, Trophy, Users, Loader2, XCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { inscripcionService, Inscripcion } from '../../../services/inscripcionService';

const estadoLabels: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  PENDIENTE_CONFIRMACION: { 
    text: 'Pendiente', 
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    icon: <Clock className="w-4 h-4" />
  },
  CONFIRMADA: { 
    text: 'Confirmada', 
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    icon: <CheckCircle className="w-4 h-4" />
  },
  RECHAZADA: { 
    text: 'Rechazada', 
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    icon: <XCircle className="w-4 h-4" />
  },
  CANCELADA: { 
    text: 'Cancelada', 
    color: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    icon: <XCircle className="w-4 h-4" />
  },
};

export function MisInscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInscripciones();
  }, []);

  const loadInscripciones = async () => {
    try {
      setIsLoading(true);
      const data = await inscripcionService.getMyInscripciones();
      setInscripciones(data);
    } catch (error) {
      toast.error('Error al cargar inscripciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta inscripción?')) return;
    
    try {
      await inscripcionService.cancelar(id);
      toast.success('Inscripción cancelada');
      loadInscripciones();
    } catch (error) {
      toast.error('Error al cancelar inscripción');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#df2531]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Mis Inscripciones</h1>
          <p className="text-gray-400">Gestiona tus inscripciones a torneos</p>
        </div>

        {/* Lista de inscripciones */}
        {inscripciones.length === 0 ? (
          <div className="bg-[#151921] border border-[#232838] rounded-xl p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tienes inscripciones</h3>
            <p className="text-gray-400 mb-4">Explora los torneos disponibles e inscríbete</p>
            <Link to="/tournaments">
              <Button>Ver Torneos</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inscripciones.map((inscripcion) => {
              const estado = estadoLabels[inscripcion.estado];
              return (
                <div
                  key={inscripcion.id}
                  className="bg-[#151921] border border-[#232838] rounded-xl p-6 hover:border-[#df2531]/30 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Info del torneo */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {inscripcion.tournament.nombre}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${estado.color}`}>
                          {estado.icon}
                          {estado.text}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#df2531]" />
                          {new Date(inscripcion.tournament.fechaInicio).toLocaleDateString('es-PY')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-[#df2531]" />
                          {inscripcion.category.nombre}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#df2531]" />
                          Pareja: {inscripcion.jugador1.nombre} {inscripcion.jugador1.apellido}
                          {inscripcion.jugador2 && ` + ${inscripcion.jugador2.nombre} ${inscripcion.jugador2.apellido}`}
                          {!inscripcion.jugador2 && inscripcion.jugador2Documento && ` + ${inscripcion.jugador2Documento}`}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      <Link to={`/tournaments/${inscripcion.tournamentId}`}>
                        <Button variant="outline" size="sm">
                          Ver Torneo
                        </Button>
                      </Link>
                      {inscripcion.estado === 'PENDIENTE_CONFIRMACION' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleCancelar(inscripcion.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
