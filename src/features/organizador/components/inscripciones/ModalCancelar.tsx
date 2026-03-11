import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, X } from 'lucide-react';

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

interface ModalCancelarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  inscripcion: Inscripcion | null;
}

export function ModalCancelar({ isOpen, onClose, onConfirm, inscripcion }: ModalCancelarProps) {
  const [motivo, setMotivo] = useState('');

  if (!inscripcion) return null;

  const handleConfirm = () => {
    onConfirm(motivo || 'Sin motivo especificado');
    setMotivo('');
  };

  const motivosComunes = [
    'No realizó el pago',
    'Desistió de participar',
    'Pareja no confirmó',
    'Cupos completos',
    'Datos incorrectos',
  ];

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
            <div className="glass rounded-2xl p-6 border border-red-500/30 shadow-2xl shadow-red-500/10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Cancelar Inscripción</h3>
                    <p className="text-gray-400 text-sm">Esta acción libera el cupo</p>
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
              <div className="bg-[#0B0E14] rounded-xl p-4 mb-4">
                <p className="text-gray-400 text-sm mb-2">Pareja:</p>
                <p className="text-white font-medium">
                  {inscripcion.jugador1.nombre} {inscripcion.jugador1.apellido}
                  {inscripcion.jugador2 && (
                    <> + {inscripcion.jugador2.nombre} {inscripcion.jugador2.apellido}</>
                  )}
                </p>
              </div>

              {/* Motivos comunes */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Motivo (opcional):</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {motivosComunes.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMotivo(m)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        motivo === m
                          ? 'bg-red-500 text-white'
                          : 'bg-[#232838] text-gray-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="O escribe otro motivo..."
                  rows={2}
                  className="w-full bg-[#0B0E14] border border-[#232838] rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-[#232838] hover:bg-[#2a3040] text-white rounded-xl transition-colors font-medium"
                >
                  Volver
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium"
                >
                  Cancelar Inscripción
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
