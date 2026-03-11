import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
}

interface Inscripcion {
  id: string;
  jugador1: Jugador;
  jugador2?: Jugador;
}

interface ModalConfirmarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  inscripcion: Inscripcion | null;
}

export function ModalConfirmar({ isOpen, onClose, onConfirm, inscripcion }: ModalConfirmarProps) {
  if (!inscripcion) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="glass rounded-2xl p-6 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Confirmar Inscripción</h3>
                    <p className="text-gray-400 text-sm">Validar pago y confirmar cupo</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#232838] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Info */}
              <div className="bg-[#0B0E14] rounded-xl p-4 mb-6">
                <p className="text-gray-400 text-sm mb-2">Pareja:</p>
                <p className="text-white font-medium">
                  {inscripcion.jugador1.nombre} {inscripcion.jugador1.apellido}
                  {inscripcion.jugador2 && (
                    <> + {inscripcion.jugador2.nombre} {inscripcion.jugador2.apellido}</>
                  )}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-[#232838] hover:bg-[#2a3040] text-white rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-medium"
                >
                  Confirmar Inscripción
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
