import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Plus, Users, Calendar, MapPin, ChevronRight, 
  Sparkles, TrendingUp
} from 'lucide-react';
import { TorneoWizard } from '../components/TorneoWizard';
import { api } from '../../../services/api';
interface Tournament {
  id: string;
  slug: string;
  nombre: string;
  ciudad: string;
  flyerUrl?: string;
  estado: 'ACTIVO' | 'BORRADOR' | 'FINALIZADO' | 'PUBLICADO';
  fechaInicio: string;
  fechaFin: string;
  costoInscripcion: number;
  sedePrincipal?: {
    nombre: string;
    ciudad: string;
  };
  _count?: {
    inscripciones?: number;
  };
}

export function MisTorneosPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [torneos, setTorneos] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [createdTorneo, setCreatedTorneo] = useState<Tournament | null>(null);

  useEffect(() => {
    loadTorneos();
  }, []);

  const loadTorneos = async () => {
    try {
      const { data } = await api.get('/admin/torneos');
      if (data.success) {
        setTorneos(data.torneos);
      }
    } catch (error) {
      console.error('Error cargando torneos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (torneo: Tournament) => {
    console.log('[MisTorneosPage] Torneo creado:', torneo);
    setShowWizard(false);
    setCreatedTorneo(torneo);
    loadTorneos();
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setCreatedTorneo(null);
  };

  // Pantalla de éxito post-creación (tiene prioridad sobre el wizard)
  if (createdTorneo) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Sparkles className="w-12 h-12 text-emerald-500" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-2">
            ¡Torneo Creado!
          </h1>
          <p className="text-gray-400 mb-8">
            Tu torneo <span className="text-white font-medium">{createdTorneo.nombre}</span> está listo para recibir inscripciones.
          </p>

          <div className="bg-[#151921] rounded-2xl p-6 border border-[#232838] mb-6">
            <p className="text-sm text-gray-400 mb-2">Link de inscripción:</p>
            <div className="flex items-center gap-2 bg-[#0B0E14] rounded-xl p-3">
              <code className="text-emerald-400 text-sm flex-1 overflow-hidden text-ellipsis">
                {window.location.origin}/t/{createdTorneo.slug}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/t/${createdTorneo.slug}`)}
                className="px-3 py-1 bg-[#232838] hover:bg-[#2a3040] rounded-lg text-xs text-white transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={`/mis-torneos/${createdTorneo.id}/gestionar`}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all"
            >
              <Trophy className="w-5 h-5" />
              Gestionar Torneo
              <ChevronRight className="w-5 h-5" />
            </a>
            <button
              onClick={() => setCreatedTorneo(null)}
              className="w-full py-3 text-gray-400 hover:text-white transition-colors"
            >
              Volver a Mis Torneos
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Wizard de creación
  if (showWizard) {
    return (
      <TorneoWizard 
        onSuccess={handleSuccess}
        onCancel={handleCloseWizard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      {/* Header */}
      <div className="bg-[#151921] border-b border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Trophy className="w-7 h-7 text-[#df2531]" />
                Mis Torneos
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Gestiona tus torneos y ve su progreso
              </p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-[#df2531]/20"
            >
              <Plus className="w-5 h-5" />
              Crear Torneo
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-4 border-[#df2531]/20 border-t-[#df2531] rounded-full"
            />
          </div>
        ) : torneos.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <div className="w-24 h-24 bg-[#df2531]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-[#df2531]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Crea tu primer torneo
              </h2>
              <p className="text-gray-400 mb-8">
                Empieza a organizar torneos de pádel y gestiona todo desde un solo lugar.
              </p>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-8 py-4 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl font-medium mx-auto transition-all"
              >
                <Plus className="w-5 h-5" />
                Crear Torneo
              </button>
            </motion.div>
          </div>
        ) : (
          /* Torneos List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {torneos.map((torneo, index) => (
                <motion.div
                  key={torneo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-[#151921] rounded-2xl overflow-hidden border border-[#232838] hover:border-[#df2531]/50 transition-all hover:shadow-xl hover:shadow-[#df2531]/10"
                >
                  {/* Flyer */}
                  <div className="aspect-[16/9] bg-[#232838] relative overflow-hidden">
                    {torneo.flyerUrl ? (
                      <img
                        src={torneo.flyerUrl}
                        alt={torneo.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="w-16 h-16 text-[#232838]" />
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${torneo.estado === 'ACTIVO' ? 'bg-emerald-500/90 text-white' : ''}
                        ${torneo.estado === 'BORRADOR' ? 'bg-yellow-500/90 text-white' : ''}
                        ${torneo.estado === 'FINALIZADO' ? 'bg-gray-500/90 text-white' : ''}
                      `}>
                        {torneo.estado === 'ACTIVO' ? 'En curso' : 
                         torneo.estado === 'BORRADOR' ? 'Borrador' : 
                         torneo.estado === 'FINALIZADO' ? 'Finalizado' : torneo.estado}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-white text-lg mb-2 truncate">
                      {torneo.nombre}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {torneo.sedePrincipal 
                          ? `${torneo.sedePrincipal.nombre} - ${torneo.sedePrincipal.ciudad}`
                          : torneo.ciudad
                        }
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(torneo.fechaInicio).toLocaleDateString('es-PY', { 
                          day: 'numeric', month: 'short' 
                        })} - {new Date(torneo.fechaFin).toLocaleDateString('es-PY', { 
                          day: 'numeric', month: 'short' 
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="w-4 h-4" />
                        {torneo._count?.inscripciones || 0} insc.
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#232838]">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">
                          Gs. {Number(torneo.costoInscripcion).toLocaleString('es-PY')}
                        </span>
                      </div>
                      <a
                        href={`/mis-torneos/${torneo.id}/gestionar`}
                        className="flex items-center gap-1 text-[#df2531] hover:text-white text-sm font-medium transition-colors"
                      >
                        Gestionar
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Card para crear nuevo */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: torneos.length * 0.1 }}
              onClick={() => setShowWizard(true)}
              className="group h-full min-h-[280px] bg-[#151921]/50 rounded-2xl border-2 border-dashed border-[#232838] hover:border-[#df2531]/50 transition-all flex flex-col items-center justify-center gap-4"
            >
              <div className="w-16 h-16 bg-[#232838] rounded-full flex items-center justify-center group-hover:bg-[#df2531]/20 transition-colors">
                <Plus className="w-8 h-8 text-gray-500 group-hover:text-[#df2531] transition-colors" />
              </div>
              <span className="text-gray-500 group-hover:text-[#df2531] font-medium transition-colors">
                Crear nuevo torneo
              </span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
