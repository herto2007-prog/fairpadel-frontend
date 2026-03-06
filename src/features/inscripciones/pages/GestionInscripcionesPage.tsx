import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, Users, Loader2, Mail } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { inscripcionService, Inscripcion } from '../../../services/inscripcionService';

const estadoLabels: Record<string, { text: string; color: string }> = {
  PENDIENTE_CONFIRMACION: { text: 'Pendiente', color: 'text-yellow-400 bg-yellow-400/10' },
  CONFIRMADA: { text: 'Confirmada', color: 'text-green-400 bg-green-400/10' },
  RECHAZADA: { text: 'Rechazada', color: 'text-red-400 bg-red-400/10' },
  CANCELADA: { text: 'Cancelada', color: 'text-gray-400 bg-gray-400/10' },
};

export function GestionInscripcionesPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) loadInscripciones();
  }, [tournamentId]);

  const loadInscripciones = async () => {
    try {
      setIsLoading(true);
      const data = await inscripcionService.getByTournament(tournamentId!);
      setInscripciones(data);
    } catch (error) {
      toast.error('Error al cargar inscripciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmar = async (id: string, estado: 'CONFIRMADA' | 'RECHAZADA') => {
    try {
      await inscripcionService.confirmar(id, estado);
      toast.success(`Inscripción ${estado === 'CONFIRMADA' ? 'confirmada' : 'rechazada'}`);
      loadInscripciones();
    } catch (error) {
      toast.error('Error al actualizar inscripción');
    }
  };

  const inscripcionesPendientes = inscripciones.filter(i => i.estado === 'PENDIENTE_CONFIRMACION');
  const inscripcionesConfirmadas = inscripciones.filter(i => i.estado === 'CONFIRMADA');
  const inscripcionesCanceladas = inscripciones.filter(i => ['RECHAZADA', 'CANCELADA'].includes(i.estado));

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
          <Link to={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Volver al torneo
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Inscripciones</h1>
          <p className="text-gray-400">Administra las inscripciones de tu torneo</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#151921] border border-[#232838] rounded-xl p-4">
            <div className="text-3xl font-bold text-white">{inscripciones.length}</div>
            <div className="text-sm text-gray-400">Total Inscripciones</div>
          </div>
          <div className="bg-[#151921] border border-[#232838] rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-400">{inscripcionesPendientes.length}</div>
            <div className="text-sm text-gray-400">Pendientes</div>
          </div>
          <div className="bg-[#151921] border border-[#232838] rounded-xl p-4">
            <div className="text-3xl font-bold text-green-400">{inscripcionesConfirmadas.length}</div>
            <div className="text-sm text-gray-400">Confirmadas</div>
          </div>
          <div className="bg-[#151921] border border-[#232838] rounded-xl p-4">
            <div className="text-3xl font-bold text-gray-400">{inscripcionesCanceladas.length}</div>
            <div className="text-sm text-gray-400">Canceladas/Rechazadas</div>
          </div>
        </div>

        {/* Lista de inscripciones pendientes */}
        {inscripcionesPendientes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              Pendientes de Confirmación
            </h2>
            <div className="space-y-4">
              {inscripcionesPendientes.map((inscripcion) => (
                <InscripcionCard
                  key={inscripcion.id}
                  inscripcion={inscripcion}
                  onConfirmar={handleConfirmar}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lista de inscripciones confirmadas */}
        {inscripcionesConfirmadas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Confirmadas
            </h2>
            <div className="space-y-4">
              {inscripcionesConfirmadas.map((inscripcion) => (
                <InscripcionCard
                  key={inscripcion.id}
                  inscripcion={inscripcion}
                  onConfirmar={handleConfirmar}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lista de inscripciones canceladas */}
        {inscripcionesCanceladas.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Canceladas / Rechazadas
            </h2>
            <div className="space-y-4">
              {inscripcionesCanceladas.map((inscripcion) => (
                <InscripcionCard
                  key={inscripcion.id}
                  inscripcion={inscripcion}
                  onConfirmar={handleConfirmar}
                />
              ))}
            </div>
          </div>
        )}

        {inscripciones.length === 0 && (
          <div className="bg-[#151921] border border-[#232838] rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay inscripciones</h3>
            <p className="text-gray-400">Aún no hay jugadores inscritos en este torneo</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface InscripcionCardProps {
  inscripcion: Inscripcion;
  onConfirmar: (id: string, estado: 'CONFIRMADA' | 'RECHAZADA') => void;
}

function InscripcionCard({ inscripcion, onConfirmar }: InscripcionCardProps) {
  const estado = estadoLabels[inscripcion.estado];
  const isPendiente = inscripcion.estado === 'PENDIENTE_CONFIRMACION';

  return (
    <div className="bg-[#151921] border border-[#232838] rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Info de la pareja */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${estado.color}`}>
              {estado.text}
            </span>
            <span className="text-sm text-gray-400">
              {inscripcion.category.nombre}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(inscripcion.createdAt).toLocaleDateString('es-PY')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jugador 1 */}
            <div className="bg-[#0B0E14] border border-[#232838] rounded-lg p-3">
              <div className="text-xs text-[#df2531] mb-1">Jugador 1</div>
              <div className="font-medium text-white">
                {inscripcion.jugador1.nombre} {inscripcion.jugador1.apellido}
              </div>
              <div className="text-sm text-gray-400">{inscripcion.jugador1.documento}</div>
            </div>

            {/* Jugador 2 */}
            <div className="bg-[#0B0E14] border border-[#232838] rounded-lg p-3">
              <div className="text-xs text-[#df2531] mb-1">Jugador 2</div>
              {inscripcion.jugador2 ? (
                <>
                  <div className="font-medium text-white">
                    {inscripcion.jugador2.nombre} {inscripcion.jugador2.apellido}
                  </div>
                  <div className="text-sm text-gray-400">{inscripcion.jugador2.documento}</div>
                </>
              ) : (
                <>
                  <div className="font-medium text-white">
                    {inscripcion.jugador2Documento || 'Sin confirmar'}
                  </div>
                  {inscripcion.jugador2Email && (
                    <div className="text-sm text-gray-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {inscripcion.jugador2Email}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Modo de pago */}
          <div className="mt-3 text-sm text-gray-400">
            Modo de pago: <span className="text-white">{inscripcion.modoPago === 'COMPLETO' ? 'Pago completo' : 'Individual'}</span>
          </div>
        </div>

        {/* Acciones */}
        {isPendiente && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => onConfirmar(inscripcion.id, 'RECHAZADA')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rechazar
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onConfirmar(inscripcion.id, 'CONFIRMADA')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirmar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
