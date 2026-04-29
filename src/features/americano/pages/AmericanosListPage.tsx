import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, MapPin, ArrowRight, Sparkles, Plus, Eye, EyeOff } from 'lucide-react';
import { BackgroundEffects } from '../../../components/ui/BackgroundEffects';
import { americanoService, AmericanoTorneo } from '../../../services/americanoService';
import { CrearAmericanoModal } from '../components/CrearAmericanoModal';
import { CompartirAmericanoModal } from '../components/CompartirAmericanoModal';
import { formatDatePYShort } from '../../../utils/date';

export function AmericanosListPage() {
  const navigate = useNavigate();
  const [torneos, setTorneos] = useState<AmericanoTorneo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [torneoCreado, setTorneoCreado] = useState<{ id: string; nombre: string } | null>(null);

  useEffect(() => {
    loadTorneos();
  }, []);

  const loadTorneos = async () => {
    try {
      setLoading(true);
      const data = await americanoService.listar();
      setTorneos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <BackgroundEffects variant="subtle" showGrid={true} />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white">Torneos Americanos</h1>
            </motion.div>
            <p className="text-white/50 text-sm">
              Formato round-robin rotativo. Inscribite gratis, jugá con diferentes parejas en cada ronda, 
              y ganá sumando la mayor cantidad de games. Nadie queda eliminado.
            </p>
          </div>
          <button
            onClick={() => setMostrarCrear(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear torneo
          </button>
        </div>

        {/* Botón mobile */}
        <button
          onClick={() => setMostrarCrear(true)}
          className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl mb-6"
        >
          <Plus className="w-4 h-4" />
          Crear torneo americano
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Grid de torneos */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {torneos.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-sm">No hay torneos americanos activos</p>
                <p className="text-white/30 text-xs mt-1">Sé el primero en crear uno</p>
              </div>
            )}
            
            {torneos.map((torneo, idx) => (
              <motion.div
                key={torneo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/americano/${torneo.id}`)}
                className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-primary/30 rounded-xl p-5 cursor-pointer transition-all duration-200"
              >
                {/* Badge formato */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                      Americano
                    </span>
                    {torneo.configAmericano?.visibilidad === 'privado' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white/50 text-xs rounded-full">
                        <EyeOff className="w-3 h-3" />
                        Privado
                      </span>
                    )}
                    {torneo.configAmericano?.visibilidad === 'publico' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white/50 text-xs rounded-full">
                        <Eye className="w-3 h-3" />
                        Público
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    torneo.estado === 'EN_CURSO' 
                      ? 'bg-green-500/20 text-green-400' 
                      : torneo.estado === 'PUBLICADO'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/10 text-white/50'
                  }`}>
                    {torneo.estado === 'EN_CURSO' ? 'En curso' : torneo.estado === 'PUBLICADO' ? 'Publicado' : 'Borrador'}
                  </span>
                </div>

                {/* Título */}
                <h3 className="text-white font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                  {torneo.nombre}
                </h3>
                
                {torneo.descripcion && (
                  <p className="text-white/40 text-xs mb-3 line-clamp-2">{torneo.descripcion}</p>
                )}

                {/* Info */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDatePYShort(torneo.fechaInicio)} - {formatDatePYShort(torneo.fechaFin)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{torneo.ciudad}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>{torneo._count.inscripciones} inscriptos</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {torneo.organizador.fotoUrl ? (
                      <img src={torneo.organizador.fotoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs">
                        {torneo.organizador.nombre[0]}
                      </div>
                    )}
                    <span className="text-white/50 text-xs">
                      {torneo.organizador.nombre} {torneo.organizador.apellido}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modales */}
        <AnimatePresence>
          {mostrarCrear && (
            <CrearAmericanoModal
              onClose={() => setMostrarCrear(false)}
              onCreated={(torneo) => {
                setMostrarCrear(false);
                setTorneoCreado(torneo);
                loadTorneos();
              }}
            />
          )}
          {torneoCreado && (
            <CompartirAmericanoModal
              torneoId={torneoCreado.id}
              torneoNombre={torneoCreado.nombre}
              onClose={() => setTorneoCreado(null)}
              onGoToTournament={() => navigate(`/americano/${torneoCreado.id}`)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AmericanosListPage;
