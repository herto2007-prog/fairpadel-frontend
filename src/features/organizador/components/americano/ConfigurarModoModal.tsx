import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Info, Trophy, Plus, Trash2, Users, Shuffle, BarChart3, Clock } from 'lucide-react';
import { americanoService, ModoJuegoConfig } from '../../../../services/americanoService';
import { useToast } from '../../../../components/ui/ToastProvider';

interface Props {
  torneoId: string;
  configInicial?: Partial<ModoJuegoConfig>;
  onClose: () => void;
  onConfigured: () => void;
}

const opciones = {
  tipoInscripcion: [
    { value: 'individual', label: 'Individual', desc: 'Cada jugador se anota solo y el sistema arma parejas en cada ronda.' },
    { value: 'parejasFijas', label: 'Parejas fijas', desc: 'Los jugadores se inscriben en parejas y juegan siempre juntos.' },
  ],
  rotacion: [
    { value: 'automatica', label: 'Automática', desc: 'El sistema arma las parejas y cruces según ranking (snake).' },
    { value: 'manual', label: 'Manual', desc: 'Vos elegís cómo armar las parejas y los cruces de cada ronda.' },
  ],
  sistemaPuntos: [
    { value: 'games', label: 'Games acumulados', desc: 'Cada jugador suma los games que gana en todos sus partidos. Más simple y justo.' },
    { value: 'sets', label: 'Sets ganados', desc: 'Se cuenta cuántos sets ganó cada jugador en total.' },
    { value: 'partido', label: 'Victorias', desc: '+3 por ganar, +1 perder. Clásico sistema por puntos.' },
    { value: 'diferencia', label: 'Diferencia de games', desc: 'Suma la diferencia (games ganados - perdidos). Más estratégico.' },
  ],
  formatoPartido: [
    { value: 'tiempo', label: 'Por tiempo', desc: 'Se juega un tiempo fijo (ej: 15 min). El que va ganando al final suma más.' },
    { value: 'games', label: 'Por games', desc: 'El primero en llegar a X games gana el partido (ej: 6 games).' },
    { value: 'mejorDe3Sets', label: 'Mejor de 3 sets', desc: 'Formato tradicional: hay que ganar 2 sets para ganar el partido.' },
  ],
};

export function ConfigurarModoModal({ torneoId, configInicial, onClose, onConfigured }: Props) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<ModoJuegoConfig>({
    tipoInscripcion: configInicial?.tipoInscripcion ?? 'individual',
    rotacion: configInicial?.rotacion ?? 'automatica',
    sistemaPuntos: configInicial?.sistemaPuntos ?? 'games',
    formatoPartido: configInicial?.formatoPartido ?? 'games',
    valorObjetivo: configInicial?.valorObjetivo ?? 6,
    conTieBreak: configInicial?.conTieBreak ?? true,
    categorias: configInicial?.categorias ?? 'sin',
    numRondas: configInicial?.numRondas ?? 4,
    canchasSimultaneas: configInicial?.canchasSimultaneas ?? 1,
    premios: configInicial?.premios ?? [],
  });

  const [premios, setPremios] = useState<{ puesto: string; descripcion: string }[]>(configInicial?.premios ?? []);

  const update = <K extends keyof ModoJuegoConfig>(key: K, value: ModoJuegoConfig[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const agregarPremio = () => {
    setPremios(prev => [...prev, { puesto: '', descripcion: '' }]);
  };

  const eliminarPremio = (idx: number) => {
    setPremios(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePremio = (idx: number, field: 'puesto' | 'descripcion', value: string) => {
    setPremios(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload: ModoJuegoConfig = {
        ...form,
        premios: premios.filter(p => p.puesto.trim() || p.descripcion.trim()),
      };
      await americanoService.configurarModo(torneoId, payload);
      showSuccess('Modo de juego configurado correctamente');
      onConfigured();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error configurando modo de juego');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0d1117] border border-[#232838] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#232838]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Configurar modo de juego</h3>
                <p className="text-white/40 text-xs">Definí cómo se juega y se puntúa este americano.</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Info */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-400/80 text-xs leading-relaxed">
                Estas opciones definen cómo se armarán las parejas, cuánto duran los partidos y cómo se calcula la clasificación. Podés cambiarlas antes de iniciar la primera ronda.
              </p>
            </div>

            {/* Tipo de inscripción */}
            <FieldGroup label="Tipo de inscripción" icon={<Users className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-2 gap-2">
                {opciones.tipoInscripcion.map(opt => (
                  <OptionCard
                    key={opt.value}
                    selected={form.tipoInscripcion === opt.value}
                    onClick={() => update('tipoInscripcion', opt.value as ModoJuegoConfig['tipoInscripcion'])}
                    label={opt.label}
                    desc={opt.desc}
                  />
                ))}
              </div>
            </FieldGroup>

            {/* Rotación */}
            <FieldGroup label="Armado de parejas" icon={<Shuffle className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-2 gap-2">
                {opciones.rotacion.map(opt => (
                  <OptionCard
                    key={opt.value}
                    selected={form.rotacion === opt.value}
                    onClick={() => update('rotacion', opt.value as ModoJuegoConfig['rotacion'])}
                    label={opt.label}
                    desc={opt.desc}
                  />
                ))}
              </div>
            </FieldGroup>

            {/* Sistema de puntos */}
            <FieldGroup label="Sistema de puntos" icon={<BarChart3 className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {opciones.sistemaPuntos.map(opt => (
                  <OptionCard
                    key={opt.value}
                    selected={form.sistemaPuntos === opt.value}
                    onClick={() => update('sistemaPuntos', opt.value as ModoJuegoConfig['sistemaPuntos'])}
                    label={opt.label}
                    desc={opt.desc}
                  />
                ))}
              </div>
            </FieldGroup>

            {/* Formato de partido */}
            <FieldGroup label="Formato de partido" icon={<Clock className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-1 gap-2">
                {opciones.formatoPartido.map(opt => (
                  <OptionCard
                    key={opt.value}
                    selected={form.formatoPartido === opt.value}
                    onClick={() => update('formatoPartido', opt.value as ModoJuegoConfig['formatoPartido'])}
                    label={opt.label}
                    desc={opt.desc}
                  />
                ))}
              </div>
            </FieldGroup>

            {/* Valor objetivo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-xs font-medium mb-1.5 block">
                  {form.formatoPartido === 'tiempo' ? 'Minutos por partido' : form.formatoPartido === 'games' ? 'Games para ganar' : 'Sets para ganar'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.valorObjetivo}
                  onChange={e => update('valorObjetivo', parseInt(e.target.value) || 1)}
                  className="w-full bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                />
                <p className="text-white/30 text-[10px] mt-1">
                  {form.formatoPartido === 'tiempo' ? 'Ej: 15 minutos' : form.formatoPartido === 'games' ? 'Ej: 6 games (como el pádel tradicional)' : 'Ej: 2 sets de 3'}
                </p>
              </div>
              <div>
                <label className="text-white/60 text-xs font-medium mb-1.5 block">Cantidad de rondas</label>
                <select
                  value={form.numRondas}
                  onChange={e => update('numRondas', e.target.value === 'automatico' ? 'automatico' : parseInt(e.target.value))}
                  className="w-full bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                >
                  <option value={3}>3 rondas</option>
                  <option value={4}>4 rondas</option>
                  <option value={5}>5 rondas</option>
                  <option value={6}>6 rondas</option>
                  <option value="automatico">Automático (todas las posibles)</option>
                </select>
                <p className="text-white/30 text-[10px] mt-1">
                  {form.numRondas === 'automatico' ? 'El sistema genera todas las combinaciones posibles.' : `Se jugarán ${form.numRondas} rondas en total.`}
                </p>
              </div>
            </div>

            {/* Canchas simultáneas */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-1.5 block">Canchas simultáneas</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.canchasSimultaneas}
                onChange={e => update('canchasSimultaneas', parseInt(e.target.value) || 1)}
                className="w-full bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
              />
              <p className="text-white/30 text-[10px] mt-1">Cuántos partidos se juegan al mismo tiempo en cada ronda.</p>
            </div>

            {/* Tie break */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.conTieBreak}
                onChange={e => update('conTieBreak', e.target.checked)}
                className="w-4 h-4 rounded border-[#232838] bg-[#151921] text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-white text-sm">Incluir tie-break</span>
                <p className="text-white/30 text-[10px]">Si un set llega a 6-6, se define con un juego especial a 7 puntos.</p>
              </div>
            </label>

            {/* Premios */}
            <FieldGroup label="Premios (opcional)" icon={<Trophy className="w-3.5 h-3.5" />}>
              {premios.length === 0 ? (
                <p className="text-white/30 text-xs">Sin premios configurados.</p>
              ) : (
                <div className="space-y-2">
                  {premios.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        placeholder="Puesto (ej: 1°)"
                        value={p.puesto}
                        onChange={e => updatePremio(i, 'puesto', e.target.value)}
                        className="flex-1 bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                      />
                      <input
                        placeholder="Descripción"
                        value={p.descripcion}
                        onChange={e => updatePremio(i, 'descripcion', e.target.value)}
                        className="flex-[2] bg-[#151921] border border-[#232838] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                      />
                      <button onClick={() => eliminarPremio(i)} className="text-white/20 hover:text-red-400 transition-colors px-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={agregarPremio}
                className="flex items-center gap-1.5 text-primary text-xs font-medium hover:text-primary/80 transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar premio
              </button>
            </FieldGroup>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-[#232838]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/60 text-sm font-medium hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              )}
              Guardar configuración
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FieldGroup({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon}
        <span className="text-white/70 text-xs font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-xl border transition-all ${
        selected
          ? 'bg-primary/10 border-primary/40'
          : 'bg-[#151921] border-[#232838] hover:border-[#2d3550]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-primary' : 'border-white/20'}`}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </div>
        <span className={`text-sm font-medium ${selected ? 'text-white' : 'text-white/70'}`}>{label}</span>
      </div>
      <p className={`text-[10px] leading-relaxed ml-5.5 ${selected ? 'text-primary/60' : 'text-white/30'}`}>{desc}</p>
    </button>
  );
}

