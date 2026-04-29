import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Eye, EyeOff, Trophy, Calendar, Users, HelpCircle, Info, UserPlus, UsersRound } from 'lucide-react';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { americanoService, CreateAmericanoTorneoPayload } from '../../../services/americanoService';
import { useToast } from '../../../components/ui/ToastProvider';

interface CrearAmericanoModalProps {
  onClose: () => void;
  onCreated: (torneo: { id: string; nombre: string }) => void;
}

export function CrearAmericanoModal({ onClose, onCreated }: CrearAmericanoModalProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAmericanoTorneoPayload>({
    nombre: '',
    descripcion: '',
    fecha: '',
    ciudad: '',
    visibilidad: 'publico',
    tipoInscripcion: 'individual',
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const torneo = await americanoService.crear(formData);
      showSuccess('Torneo americano creado');
      onCreated(torneo);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al crear torneo');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = formData.nombre && formData.ciudad && formData.fecha;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#232838]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-white font-bold">Crear Torneo Americano</h2>
              <p className="text-white/40 text-xs">Configurá el modo de juego después de cerrar inscripciones</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info: qué es un americano */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex gap-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-white/70 text-xs leading-relaxed">
                En un <strong className="text-white">torneo americano</strong> las parejas rotan en cada ronda. 
                Todos juegan con todos y nadie queda eliminado. Gana quien acumule más games al final.
              </p>
              <p className="text-white/40 text-xs mt-1">
                Después de crearlo, compartí el link con tus amigos para que se inscriban. 
                Una vez cerradas las inscripciones, configurás el modo de juego y empezás.
              </p>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Nombre del torneo *</label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Americano del Club"
                className="w-full bg-white/[0.03] border border-[#232838] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Ej: Traer pelotas, empezamos puntual a las 9:00..."
              rows={2}
              className="w-full bg-white/[0.03] border border-[#232838] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors resize-none"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Fecha del torneo *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full bg-white/[0.03] border border-[#232838] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors [color-scheme:dark]"
              />
            </div>
            <p className="text-white/30 text-xs mt-1">Día en que se juega el torneo.</p>
          </div>

          {/* Ciudad */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Ciudad *</label>
            <CityAutocomplete
              value={formData.ciudad}
              onChange={(value) => setFormData({ ...formData, ciudad: value })}
              placeholder="Busca tu ciudad..."
            />
            <p className="text-white/30 text-xs mt-1">Para que otros jugadores cercanos puedan encontrarlo.</p>
          </div>

          {/* Límite de inscripciones */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-white/50 text-xs font-medium">Límite de inscripciones</label>
              <div className="group relative">
                <HelpCircle className="w-3 h-3 text-white/20 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1a1f2e] border border-[#232838] rounded-lg text-white/60 text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  Si lo dejás vacío, no hay límite. El mínimo para jugar son 4 jugadores.
                </div>
              </div>
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="number"
                min={4}
                value={formData.limiteInscripciones || ''}
                onChange={(e) => setFormData({ ...formData, limiteInscripciones: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Sin límite (mínimo 4)"
                className="w-full bg-white/[0.03] border border-[#232838] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Tipo de inscripción */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Modalidad de inscripción</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, tipoInscripcion: 'individual' })}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  formData.tipoInscripcion === 'individual'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/[0.03] border-[#232838] text-white/50 hover:text-white/70'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <div className="text-left">
                  <p className="text-sm font-medium">Individual</p>
                  <p className="text-xs opacity-60">Cada uno se inscribe solo, las parejas rotan</p>
                </div>
              </button>
              <button
                onClick={() => setFormData({ ...formData, tipoInscripcion: 'parejasFijas' })}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  formData.tipoInscripcion === 'parejasFijas'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/[0.03] border-[#232838] text-white/50 hover:text-white/70'
                }`}
              >
                <UsersRound className="w-4 h-4" />
                <div className="text-left">
                  <p className="text-sm font-medium">Parejas fijas</p>
                  <p className="text-xs opacity-60">Se inscriben en pareja, juegan siempre juntos</p>
                </div>
              </button>
            </div>
            <p className="text-white/30 text-xs mt-1.5">
              {formData.tipoInscripcion === 'individual'
                ? 'El sistema arma parejas diferentes en cada ronda. Todos juegan con todos.'
                : 'Cada jugador debe traer a su compañero. Las parejas no cambian durante el torneo.'}
            </p>
          </div>

          {/* Visibilidad */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Visibilidad</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, visibilidad: 'publico' })}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  formData.visibilidad === 'publico'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/[0.03] border-[#232838] text-white/50 hover:text-white/70'
                }`}
              >
                <Eye className="w-4 h-4" />
                <div className="text-left">
                  <p className="text-sm font-medium">Público</p>
                  <p className="text-xs opacity-60">Cualquiera puede verlo y unirse</p>
                </div>
              </button>
              <button
                onClick={() => setFormData({ ...formData, visibilidad: 'privado' })}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  formData.visibilidad === 'privado'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/[0.03] border-[#232838] text-white/50 hover:text-white/70'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <div className="text-left">
                  <p className="text-sm font-medium">Privado</p>
                  <p className="text-xs opacity-60">Solo quien tenga el link</p>
                </div>
              </button>
            </div>
            <p className="text-white/30 text-xs mt-1.5">
              {formData.visibilidad === 'publico' 
                ? 'Aparecerá en el listado de torneos americanos para que cualquiera se una.'
                : 'No aparecerá en listados. Solo los que reciban el link podrán entrar.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-[#232838]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/[0.05] text-white text-sm rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="flex-1 py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Crear torneo gratis
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
