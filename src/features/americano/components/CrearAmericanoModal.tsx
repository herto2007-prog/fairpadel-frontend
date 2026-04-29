import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Eye, EyeOff, Trophy, Calendar, MapPin, Hash, Target } from 'lucide-react';
import { americanoService, CreateAmericanoTorneoPayload } from '../../../services/americanoService';
import { useToast } from '../../../components/ui/ToastProvider';

interface CrearAmericanoModalProps {
  onClose: () => void;
  onCreated: (torneo: { id: string; nombre: string }) => void;
}

export function CrearAmericanoModal({ onClose, onCreated }: CrearAmericanoModalProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAmericanoTorneoPayload & { visibilidad: string }>({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    ciudad: '',
    numRondas: 4,
    puntosPorVictoria: 3,
    puntosPorDerrota: 1,
    gamesPorSet: 6,
    visibilidad: 'publico',
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

  const canSubmit = formData.nombre && formData.ciudad && formData.fechaInicio && formData.fechaFin;

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
        className="bg-[#151921] border border-[#232838] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#232838]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-white font-bold">Crear Torneo Americano</h2>
              <p className="text-white/40 text-xs">Gratis · Round-robin rotativo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
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
              placeholder="Detalles del torneo..."
              rows={2}
              className="w-full bg-white/[0.03] border border-[#232838] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors resize-none"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs font-medium mb-1.5 block">Fecha inicio *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  className="w-full bg-white/[0.03] border border-[#232838] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs font-medium mb-1.5 block">Fecha fin *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  className="w-full bg-white/[0.03] border border-[#232838] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Ciudad */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Ciudad *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Ej: Asunción"
                className="w-full bg-white/[0.03] border border-[#232838] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Configuración */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white/40 text-xs font-medium">Configuración del formato</p>
            <div className="grid grid-cols-3 gap-3">
              <ConfigInput
                icon={<Hash className="w-3.5 h-3.5" />}
                label="Rondas"
                value={formData.numRondas || 4}
                onChange={(v) => setFormData({ ...formData, numRondas: v })}
                min={1}
                max={10}
              />
              <ConfigInput
                icon={<Target className="w-3.5 h-3.5" />}
                label="Pts victoria"
                value={formData.puntosPorVictoria || 3}
                onChange={(v) => setFormData({ ...formData, puntosPorVictoria: v })}
                min={1}
                max={10}
              />
              <ConfigInput
                icon={<Target className="w-3.5 h-3.5" />}
                label="Games/set"
                value={formData.gamesPorSet || 6}
                onChange={(v) => setFormData({ ...formData, gamesPorSet: v })}
                min={1}
                max={10}
              />
            </div>
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
                  <p className="text-xs opacity-60">Aparece en el listado</p>
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
                  <p className="text-xs opacity-60">Solo por link</p>
                </div>
              </button>
            </div>
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

function ConfigInput({ icon, label, value, onChange, min, max }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-white/30 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        className="w-full bg-white/[0.03] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm text-center focus:border-primary outline-none transition-colors"
      />
    </div>
  );
}
