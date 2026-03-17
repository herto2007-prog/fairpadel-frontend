import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Trash2, Save } from 'lucide-react';
import { programacionService, Cancha } from './programacionService';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useConfirm } from '../../../../hooks/useConfirm';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { ParejaAvatar } from '../../../../components/ui/ParejaAvatar';
import { getColorFase } from '../../utils/faseColors';

interface Partido {
  id: string;
  fase: string;
  categoriaNombre: string;
  esBye: boolean;
  fechaProgramada?: string | null;
  horaProgramada?: string | null;
  torneoCanchaId?: string | null;
  inscripcion1?: {
    id: string;
    jugador1: { nombre: string; apellido: string; fotoUrl?: string | null };
    jugador2?: { nombre: string; apellido: string; fotoUrl?: string | null };
  } | null;
  inscripcion2?: {
    id: string;
    jugador1: { nombre: string; apellido: string; fotoUrl?: string | null };
    jugador2?: { nombre: string; apellido: string; fotoUrl?: string | null };
  } | null;
}

interface ModalEditarProgramacionProps {
  isOpen: boolean;
  onClose: () => void;
  partido: Partido | null;
  tournamentId: string;
  onSuccess: () => void;
}

export function ModalEditarProgramacion({
  isOpen,
  onClose,
  partido,
  tournamentId,
  onSuccess,
}: ModalEditarProgramacionProps) {
  const { showSuccess, showError } = useToast();
  const { confirm, ...confirmState } = useConfirm();
  
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  // Formulario
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [canchaId, setCanchaId] = useState('');

  // Cargar canchas al abrir
  useEffect(() => {
    if (isOpen && tournamentId) {
      cargarCanchas();
    }
  }, [isOpen, tournamentId]);

  // Resetear formulario cuando cambia el partido
  useEffect(() => {
    if (partido) {
      setFecha(partido.fechaProgramada ? new Date(partido.fechaProgramada).toISOString().split('T')[0] : '');
      setHora(partido.horaProgramada || '');
      setCanchaId(partido.torneoCanchaId || '');
    }
  }, [partido]);

  const cargarCanchas = async () => {
    setCargando(true);
    try {
      const data = await programacionService.getCanchas(tournamentId);
      if (data.success) {
        setCanchas(data.canchas);
      }
    } catch (error) {
      console.error('Error cargando canchas:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    if (!partido) return;
    
    if (!fecha || !hora || !canchaId) {
      showError('Campos requeridos', 'Debes seleccionar fecha, hora y cancha');
      return;
    }

    setGuardando(true);
    try {
      await programacionService.actualizarPartido(partido.id, fecha, hora, canchaId);
      showSuccess('Éxito', 'Partido programado correctamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error guardando:', error);
      showError('Error', error.response?.data?.message || 'Error al guardar la programación');
    } finally {
      setGuardando(false);
    }
  };

  const handleDesprogramar = async () => {
    if (!partido) return;

    const confirmed = await confirm({
      title: 'Desprogramar partido',
      message: '¿Estás seguro de que deseas quitar la programación de este partido? Se liberará el slot reservado.',
      confirmText: 'Desprogramar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });

    if (!confirmed) return;

    setGuardando(true);
    try {
      await programacionService.desprogramarPartido(partido.id);
      showSuccess('Éxito', 'Partido desprogramado correctamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error desprogramando:', error);
      showError('Error', error.response?.data?.message || 'Error al desprogramar');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen || !partido) return null;

  // getColorFase se importa desde utils/faseColors

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#151921] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#df2531]" />
              <h2 className="text-lg font-bold text-white">
                {partido.fechaProgramada ? 'Editar Programación' : 'Programar Partido'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Info del partido */}
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${getColorFase(partido.fase)}`}>
                  {partido.fase}
                </span>
                <span className="text-xs text-neutral-500">{partido.categoriaNombre}</span>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ParejaAvatar 
                    jugador1={partido.inscripcion1?.jugador1}
                    jugador2={partido.inscripcion1?.jugador2}
                    size="sm"
                  />
                  <span className="text-sm text-white">
                    {partido.inscripcion1?.jugador1.apellido}
                    {partido.inscripcion1?.jugador2 && `/${partido.inscripcion1.jugador2.apellido}`}
                  </span>
                </div>
                
                <span className="text-neutral-500 text-xs">vs</span>
                
                <div className="flex items-center gap-2">
                  <ParejaAvatar 
                    jugador1={partido.inscripcion2?.jugador1}
                    jugador2={partido.inscripcion2?.jugador2}
                    size="sm"
                  />
                  <span className="text-sm text-white">
                    {partido.inscripcion2?.jugador1.apellido}
                    {partido.inscripcion2?.jugador2 && `/${partido.inscripcion2.jugador2.apellido}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-3">
              {/* Fecha */}
              <div>
                <label className="flex items-center gap-2 text-sm text-neutral-400 mb-1.5">
                  <Calendar className="w-4 h-4" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
                />
              </div>

              {/* Hora */}
              <div>
                <label className="flex items-center gap-2 text-sm text-neutral-400 mb-1.5">
                  <Clock className="w-4 h-4" />
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  El partido durará aproximadamente 1.5 horas
                </p>
              </div>

              {/* Cancha */}
              <div>
                <label className="flex items-center gap-2 text-sm text-neutral-400 mb-1.5">
                  <MapPin className="w-4 h-4" />
                  Cancha
                </label>
                {cargando ? (
                  <div className="flex items-center gap-2 text-neutral-500 text-sm py-2">
                    <div className="w-4 h-4 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
                    Cargando canchas...
                  </div>
                ) : (
                  <select
                    value={canchaId}
                    onChange={(e) => setCanchaId(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#df2531] focus:outline-none"
                  >
                    <option value="">Seleccionar cancha...</option>
                    {canchas.map(cancha => (
                      <option key={cancha.id} value={cancha.id}>
                        {cancha.sede} - {cancha.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              
              {partido.fechaProgramada && (
                <button
                  onClick={handleDesprogramar}
                  disabled={guardando}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Desprogramar
                </button>
              )}
              
              <button
                onClick={handleGuardar}
                disabled={guardando || !fecha || !hora || !canchaId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#df2531] hover:bg-[#df2531]/90 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={confirmState.close}
          onConfirm={confirmState.handleConfirm}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          variant={confirmState.variant}
        />
      </motion.div>
    </AnimatePresence>
  );
}
