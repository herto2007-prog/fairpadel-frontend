import { useEffect, useState } from 'react';
import { inscripcionService, Inscripcion } from '../../../services/inscripcionService';
import { Calendar, Trophy, Clock, MapPin, Users } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const estadoConfig = {
  PENDIENTE_PAGO: { color: 'text-yellow-500', label: 'Pendiente de pago', bgColor: 'bg-yellow-500/10' },
  PENDIENTE_CONFIRMACION: { color: 'text-blue-500', label: 'Pendiente de confirmación', bgColor: 'bg-blue-500/10' },
  CONFIRMADA: { color: 'text-green-500', label: 'Confirmada', bgColor: 'bg-green-500/10' },
  CANCELADA: { color: 'text-red-500', label: 'Cancelada', bgColor: 'bg-red-500/10' },
};

export default function MisInscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    loadInscripciones();
    
    // Mostrar mensaje de éxito si viene del wizard de inscripción
    if (location.state?.success) {
      setSuccessMessage('¡Inscripción realizada con éxito! Tu lugar está reservado.');
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [location]);

  const loadInscripciones = async () => {
    try {
      setLoading(true);
      const data = await inscripcionService.getMyInscripciones();
      setInscripciones(data);
    } catch (err) {
      console.error('Error loading inscripciones:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mis Inscripciones</h1>

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{successMessage}</span>
            </div>
            <p className="mt-2 text-sm text-green-300/80">
              Recibirás un email de confirmación con los detalles. El organizador se contactará para coordinar el pago.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {inscripciones.map((inscripcion) => {
            const config = estadoConfig[inscripcion.estado];
            const torneoNombre = inscripcion.tournament?.nombre || 'Torneo';
            const categoriaNombre = inscripcion.category?.nombre || 'Categoría';
            const fecha = inscripcion.tournament?.fechaInicio 
              ? new Date(inscripcion.tournament.fechaInicio).toLocaleDateString('es-PY')
              : null;

            return (
              <div
                key={inscripcion.id}
                className="bg-[#151921] rounded-lg border border-[#232838] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy size={18} className="text-[#df2531]" />
                      <span className="font-medium text-lg">{torneoNombre}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{categoriaNombre}</span>
                      </div>
                      
                      {fecha && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{inscripcion.tournament?.ciudad || 'Ciudad del Este'}</span>
                        </div>
                      )}
                      
                      {(inscripcion.jugador2 || inscripcion.jugador2Id) && (
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>Pareja: {inscripcion.jugador2?.nombre || 'Invitado'} {inscripcion.jugador2?.apellido || ''}</span>
                        </div>
                      )}
                    </div>

                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.color} ${config.bgColor}`}>
                      <Clock size={14} />
                      <span>{config.label}</span>
                    </div>
                  </div>
                </div>

                {/* Info adicional según estado */}
                {inscripcion.estado === 'PENDIENTE_PAGO' && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-400">
                    <p>💳 El organizador se contactará para coordinar el pago.</p>
                  </div>
                )}
                
                {inscripcion.estado === 'PENDIENTE_CONFIRMACION' && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-400">
                    <p>⏳ Tu inscripción está siendo revisada por el organizador.</p>
                  </div>
                )}
                
                {inscripcion.estado === 'CONFIRMADA' && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
                    <p>✅ ¡Inscripción confirmada! Te esperamos en el torneo.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {inscripciones.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">No tienes inscripciones activas</p>
            <p className="text-sm">Explora los torneos disponibles y ¡inscríbete!</p>
          </div>
        )}
      </div>
    </div>
  );
}
